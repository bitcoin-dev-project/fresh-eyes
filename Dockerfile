FROM rust:1.76.0-slim-buster as builder

WORKDIR /usr/src/fresheyes-grpc

COPY . .

RUN apt-get update && apt-get install -y protobuf-compiler-grpc

# Install the required target
RUN rustup target add x86_64-unknown-linux-gnu

# Install the required dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    pkg-config \
    libpq-dev \
    libssl-dev \
    libz-dev

# Build the application
RUN cargo build --release --bin fresheyes-grpc

# Run the application
ENTRYPOINT ["./target/release/fresheyes-grpc"]

EXPOSE 50051
