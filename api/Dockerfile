# Stage 1: Building the application
FROM rust:1.76.0-slim-buster as builder

WORKDIR /usr/src/fresh_eyes_api

COPY . .

# Install the required dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    pkg-config \
    libpq-dev \
    libssl-dev \
    libz-dev \
    ca-certificates

# Install the required target
RUN rustup target add x86_64-unknown-linux-gnu

# Build the application
RUN cargo build --release --bin fresh_eyes_api

# Stage 2: Setting up the final image
FROM debian:buster-slim

WORKDIR /usr/src/fresh_eyes_api

# Install the required libraries
RUN apt-get update && apt-get install -y libssl1.1 ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /usr/src/fresh_eyes_api/target/release/fresh_eyes_api .

# Run the application
ENTRYPOINT ["./fresh_eyes_api"]

EXPOSE 8080