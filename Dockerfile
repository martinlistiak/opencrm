# Stage 1: Build Rust backend
FROM rust:1.83-slim-bookworm AS backend-builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependencies
COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Build actual app
COPY backend/src ./src
COPY backend/migrations ./migrations
RUN touch src/main.rs && cargo build --release

# Stage 2: Build React frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 3: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend binary and migrations
COPY --from=backend-builder /app/target/release/opencrm-backend /app/opencrm-backend
COPY --from=backend-builder /app/migrations /app/migrations

# Copy frontend build
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Create uploads directory
RUN mkdir -p /app/uploads/cv

# Nginx config for combined deployment
RUN rm /etc/nginx/sites-enabled/default 2>/dev/null || true
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Supervisor config to run both services
COPY <<'EOF' /etc/supervisor/conf.d/app.conf
[supervisord]
nodaemon=true
user=root

[program:backend]
command=/app/opencrm-backend
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
