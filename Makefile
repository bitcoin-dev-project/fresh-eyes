RUST_DIR := $(shell pwd)

JS_DIR := $(RUST_DIR)/client

build-client:
	cd $(JS_DIR) && npm install

build-server:
	cargo build

build-all:
	make build-client
	make build-server

run-js:
	cd $(JS_DIR) && npm run start ${PR_URL}

run:
	cargo run -- ${OWNER} ${REPO} ${PR_NO}

run-grpc:
	cargo run --bin fresheyes-grpc

cli help:
	cargo run -- --help

help:
	@echo "build-client: build the client (JS)"
	@echo "build-server: build the server (Rust)"
	@echo "build-all: build the client and server"
	@echo "run-js: run the client"
	@echo "run: run the cli server"
	@echo "help: show this help message"
	@echo "cli help: show the cli command message"