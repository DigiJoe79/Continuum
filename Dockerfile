# Dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + nginx
FROM python:3.11-slim
WORKDIR /app

# Install nginx and remove default site
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Create data directory and set database path
RUN mkdir -p /app/data
ENV DATABASE_URL=sqlite:////app/data/continuum.db

# Startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80 8000
CMD ["/start.sh"]
