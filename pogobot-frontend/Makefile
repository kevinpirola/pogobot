CURRENT_DIRECTORY := $(shell pwd)

debug:
	@docker-compose up

start:
	@docker-compose up -d

start-prod:
	@docker-compose -f docker-compose.prod.yml up -d

stop:
	@docker-compose stop

status:
	@docker-compose ps

cli:
	@docker-compose run --rm pogobot /bin/bash

restart:
	@docker-compose stop pogobot
	@docker-compose start pogobot

build:
	@docker-compose build
