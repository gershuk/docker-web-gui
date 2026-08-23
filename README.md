# Docker Dashboard

## A simple GUI interface for Docker Containers

## Features

- Instantly start/stop, restart, delete and see the logs of a docker container.
- Filter containers by their running status.
- Create groups of docker container.
- Bulk action on container based on group.
- Live system consumption stat for active docker containers.
- Run or delete an image.
- Prune Docker images.
- Prune Docker containers.
- Prune Docker volumes.
- Prune Docker systems.
- No need to use the terminal for common tasks.

## A word about this fork

This repository is a fork of the [rakibtg/docker-web-gui](https://github.com/rakibtg/docker-web-gui) project. 

Here is what adjusted:

- Made the UI more compact and tidy (navigation, cards, spacing).
- Reduced network polling so the page responds quickly without taxing the device.
- Adjusted UI scaling and layouts for smaller and more limited screens.
- Fixed the units shown for container RAM and network usage.
- Removed pre-built frontend artifacts from the repository — the client is now built during the Docker image build stage.
- Added a multi-stage Dockerfile and a GitHub Actions workflow that builds and publishes the image on push to `main`.
- Added a built-in login page with persistent sessions (added by gershuk) — see [Authentication](#authentication).

## Authentication

This fork adds a built-in authentication page (added by gershuk). Here is how it works:

- **No registration** — the service provisions a single admin account automatically on the first start.
- **Credentials** are taken from the `AUTH_USERNAME` and `AUTH_PASSWORD` environment variables (defaults: `admin` / `admin` — change them before the first start!). The password is never stored in plain text: it is saved as a **bcrypt hash** in the local SQLite database (`data.db`).
- **Where to set them** — create a `.env` file in the project root (copy `.env.example`). With `docker compose` the file is read automatically; when running `node app.js` directly, the backend loads it via `dotenv`. The password is stored as a bcrypt hash in `data.db`. On every start the backend compares the environment password with the stored hash: if it **changed**, the new password is applied and **all sessions are revoked** (every device must log in again); if it's the **same**, existing sessions are kept.
- **Persistent login** — after a successful login the browser receives a signed session cookie (`HttpOnly`, `SameSite=Lax`). The session lives for **6 months of activity** (a sliding timeout; configure with the `SESSION_TTL_DAYS` environment variable), so when you revisit the page from the same browser you are already logged in — no need to re-authenticate.
- **Survives restarts** — sessions are stored server-side in the SQLite database, so a page reload or even a server restart does not log you out.
- **Multiple devices** — logging in from another browser or device creates an independent session and does not log out the other devices.
- **Logout** — use the button in the navigation bar. It immediately revokes the session on the server and clears the cookie.
- **Brute-force protection** — login attempts are rate-limited (10 attempts per 15 minutes per IP).
- **CSRF protection** — the session cookie uses `SameSite=Lax`, and all state-changing requests must carry a custom `X-Requested-With` header (the client sends it automatically).
- **Docker** — the SQLite database (`data.db`) is stored in a Docker **named volume** (`docker-web-gui-data`), so the account and sessions survive container recreation. Sessions are revoked automatically when the password in the environment changes (see above).

## Start the app

Before you follow below steps to start the app, make sure you have `node` and `npm` installed in your system.

- Clone the repository
  ```
  git clone git@github.com:gershuk/docker-web-gui.git
  ```
- Change directory
  ```
  cd ./docker-web-gui
  ```
- Run `app.js`, it will automatically install all the [node modules](https://github.com/gershuk/docker-web-gui/blob/main/backend/package.json) for you if not installed already.
  ```
  node app.js
  ```
- Now visit http://localhost:3230/

## Using Docker

You can run this application through a docker container, but it only works in **MacOS**. You can use that with/without [**`docker compose`**](https://docs.docker.com/compose/).
Also, the application will be exposed at port http://localhost:3230.

### Pull a ready-made image

No need to build anything — a ready-to-run image is published on Docker Hub: [blitz9/docker-web-gui](https://hub.docker.com/r/blitz9/docker-web-gui).

Just download and run the ready image:

```
docker pull blitz9/docker-web-gui
docker run -p 3230:3230 -v /var/run/docker.sock:/var/run/docker.sock blitz9/docker-web-gui
```

Then open http://localhost:3230/.

### Without Docker Compose

If you don't have a docker compose, then you can use the following commands:

- To build the image:
  ```
  docker build . -t docker-web-gui
  ```
- To run the image:
  ```
  docker run -p 3230:3230 -v /usr/local/bin/docker:/usr/local/bin/docker -v /var/run/docker.sock:/var/run/docker.sock docker-web-gui
  ```

### With Docker Compose

If you already docker compose installed, then simply do this:

```
docker-compose build
docker-compose up
```

### Docker Based Commands

A `Makefile` has been included with this repo. It has following commands:

1. `make up` to build the image and starting `docker-web-gui` container.
2. `make build` to build the image.
3. `make start` to start containers if application has been up already.
4. `make stop` to stop application.
5. `make restart` to restart application.
6. `make build-without-compose` to build the application without _docker compose_.
7. `make run-without-compose` to run the application without _docker compose_.

# Documentations

- [Backend API](https://github.com/gershuk/docker-web-gui/tree/main/backend)
- [Client](https://github.com/gershuk/docker-web-gui/tree/main/client)

Developed by [Hasan](https://twitter.com/rakibtg) and [contributors](https://github.com/rakibtg/docker-web-gui/graphs/contributors). Forked and maintained by gershuk.