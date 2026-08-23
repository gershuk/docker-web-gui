const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const port = 3230;

const db = require("./utilities/db");
const KnexSessionStore = require("./utilities/sessionStore");
const AuthController = require("./controllers/AuthController");

// Sliding session lifetime, default 180 days (6 months).
const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || "180", 10);

async function bootstrap() {
  // Boot the database (tables for users/sessions/groups/settings) before
  // creating any middleware that depends on it.
  await db.boot();

  // Secret used to sign session cookies. Persisted in SQLite so that all
  // existing sessions keep working after a server restart.
  const sessionSecret = await db.getOrCreateSessionSecret();

  const app = express();

  app.use(express.json());
  app.use(cors({ credentials: true }));

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
        secure: "auto",
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
