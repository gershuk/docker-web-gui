const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const session = require("express-session");
const port = 3230;

// Load environment variables from the project-root .env file (if present)
// before anything else reads process.env. Values already set in the
// environment (e.g. by docker-compose) take precedence.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("./utilities/db");
const KnexSessionStore = require("./utilities/sessionStore");
const AuthController = require("./controllers/AuthController");

// Sliding session lifetime, default 180 days (6 months).
const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || "180", 10);

// Number of trusted reverse-proxy hops (usually 1 when behind nginx). Makes
// req.ip and req.secure reflect the real client via X-Forwarded-For and
// X-Forwarded-Proto, so the login rate-limit works per client and the session
// cookie can get the Secure flag.
const TRUST_PROXY = process.env.TRUST_PROXY;

// Session cookie Secure attribute: "true" forces it (HTTPS only), "false"
// disables it, default "auto" — set only when the request arrived over HTTPS.
const COOKIE_SECURE =
  process.env.COOKIE_SECURE === "true"
    ? true
    : process.env.COOKIE_SECURE === "false"
    ? false
    : "auto";

// Explicitly allowed cross-origin hosts (comma separated). Same-origin
// requests are always allowed. Useful only for local development (e.g. the
// Create React App dev server on :3000).
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

function parseTrustProxy(value) {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? value : num;
}

async function bootstrap() {
  // Boot the database (tables for users/sessions/groups/settings) before
  // creating any middleware that depends on it.
  await db.boot();

  // Secret used to sign session cookies. Persisted in SQLite so that all
  // existing sessions keep working after a server restart.
  const sessionSecret = await db.getOrCreateSessionSecret();

  const app = express();

  const trustProxy = parseTrustProxy(TRUST_PROXY);
  if (trustProxy !== undefined) {
    app.set("trust proxy", trustProxy);
  }

  // Basic security headers. CSP and COEP are left disabled so the legacy
  // Create React App bundle keeps working; the CSP can be enforced in nginx.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(express.json());

  // CORS: same-origin requests are always allowed; cross-origin only from the
  // explicitly configured origins (CORS_ORIGIN). Everything else gets no CORS
  // headers, so browsers block it.
  app.use((req, res, next) => {
    const sameOrigin = `${req.protocol}://${req.get("host")}`;
    cors({
      credentials: true,
      origin: [sameOrigin, ...CORS_ORIGIN]
    })(req, res, next);
  });

  // Server-side sessions stored in SQLite. The browser only receives a signed
  // session id cookie (HttpOnly, SameSite=Lax, 6-month sliding expiry).
  app.use(
    session({
      name: "connect.sid",
      secret: sessionSecret,
      store: new KnexSessionStore(),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        path: "/",
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "lax",
        maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
      }
    })
  );

  app.use(express.static(path.join(__dirname, "web")));

  const { DefaultController } = require("./controllers/DefaultController");
  const {
    GenericCommandController,
  } = require("./controllers/GenericCommandController");
  const ContainerController = require("./controllers/ContainerController");
  const ImageController = require("./controllers/ImageController");
  const GroupController = require("./controllers/GroupController");
  const CleanUpController = require("./controllers/CleanUpController");

  // Public authentication endpoints.
  app.get("/api/auth/me", AuthController.me);
  app.post("/api/auth/login", AuthController.loginLimiter, AuthController.login);
  app.post("/api/auth/logout", AuthController.requireAuth, AuthController.logout);

  // Everything below /api requires an authenticated session and, for
  // state-changing methods, a same-origin custom header (CSRF defense).
  app.use("/api", AuthController.requireAuth);
  app.use("/api", AuthController.csrfProtection);

  app.get("/", DefaultController);
  app.get("/api/generic", GenericCommandController);

  app.get("/api/container/fetch", ContainerController.fetch);
  app.get("/api/container/fetchById", ContainerController.fetchById);
  app.get("/api/container/command", ContainerController.command);
  app.get("/api/container/logs", ContainerController.logs);
  app.get("/api/container/stats", ContainerController.stats);

  app.get("/api/image/fetch", ImageController.fetch);
  app.get("/api/image/command", ImageController.command);
  app.get("/api/cleanup/command", CleanUpController.command);

  app.post("/api/groups", GroupController.create);
  app.get("/api/groups", GroupController.fetch);
  app.delete("/api/groups", GroupController.delete);

  // JSON error handler.
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}

bootstrap();
