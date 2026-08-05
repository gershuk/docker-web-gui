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

Everyone is welcome here. Whether you are here to use the tool, report a small issue, propose an idea, or open a pull request — you are valued. Please be kind and respectful to all participants, just as we try to be to you.

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