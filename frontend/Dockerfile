# -----------------------------------------------------------------------------
# Frontend image - multi-stage build
#   Stage 1 (build):   build the React app into static files (dist/)
#   Stage 2 (runtime): nginx serves those files and forwards /api to the backend
# -----------------------------------------------------------------------------

# ---- Stage 1: build ---------------------------------------------------------
# Official Node.js 24 LTS image based on Alpine Linux
FROM node:24-alpine AS build
# Every following command runs inside /app
WORKDIR /app
# Copy the dependency manifests first so Docker can cache the install step
COPY package.json package-lock.json ./
# Install the exact versions from package-lock.json
RUN npm ci
# Copy the rest of the source code (filtered by .dockerignore)
COPY . .
# Optional absolute API URL; empty = same origin (nginx proxies /api)
ARG VITE_API_URL=""
# Expose it to Vite during the build
ENV VITE_API_URL=$VITE_API_URL
# Type-check and build the production bundle into /app/dist
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------
# Small, production-grade web server
FROM nginx:stable-alpine AS runtime
# Our nginx configuration (SPA routing + API proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# The built static files from stage 1
COPY --from=build /app/dist /usr/share/nginx/html
# nginx listens on port 80 inside the container
EXPOSE 80
# Docker checks that nginx answers
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
# (The nginx base image already defines the start command)
