# Build stage
FROM rust:1.83-slim-bookworm AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Build actual app
COPY src ./src
COPY migrations ./migrations
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/opencrm-backend /app/opencrm-backend
COPY --from=builder /app/migrations /app/migrations

RUN mkdir -p /app/uploads/cv

ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

EXPOSE 3000

CMD ["/app/opencrm-backend"]
