# syntax=docker/dockerfile:1.7

FROM rust:1.94.0-bookworm AS builder
WORKDIR /src

ENV CARGO_BUILD_JOBS=4 \
    CARGO_INCREMENTAL=0 \
    RUST_MIN_STACK=16777216

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    protobuf-compiler \
    pkg-config \
    libpq-dev \
    libssl-dev && \
    rm -rf /var/lib/apt/lists/*

COPY . /src/stackloom
COPY --from=neocrates / /src/neocrates

WORKDIR /src/stackloom/backend

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/src/stackloom/backend/target \
    cargo build --release -p monolith && \
    cp /src/stackloom/backend/target/release/monolith /tmp/monolith

FROM debian:bookworm-slim AS runtime
WORKDIR /app

LABEL maintainer="ooiai@gmail.com"
LABEL version="1.0.0"
LABEL rust_version="1.94.0"

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libpq5 \
    libssl3 && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -u 10001 -m -s /usr/sbin/nologin appuser

COPY --from=builder /tmp/monolith /app/monolith

USER 10001:10001

EXPOSE 6620

CMD ["/app/monolith"]
