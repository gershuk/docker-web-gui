build:
	DOCKER_BUILDKIT=1 docker-compose build

up:
	docker-compose up -d

up-non-daemon:
	docker-compose up

start:
	docker-compose start

stop:
	docker-compose stop

restart:
	docker-compose stop && docker-compose start

run-without-compose:
	docker run -p 3230:3230 -v /usr/local/bin/docker:/usr/local/bin/docker -v /var/run/docker.sock:/var/run/docker.sock docker-web-gui

build-without-compose:
	DOCKER_BUILDKIT=1 docker build . -t docker-web-gui
