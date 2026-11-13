# -----------------------------------------------------------------------------
# Backend image - multi-stage build
#   Stage 1 (build):   install ALL dependencies and compile TypeScript -> dist/
#   Stage 2 (runtime): only production dependencies + compiled JavaScript
# The final image is smaller and contains no compiler or test tools.
# -----------------------------------------------------------------------------

# ---- Stage 1: build ---------------------------------------------------------
# Official Node.js 24 LTS image based on Alpine Linux (small)
FROM node:24-alpine AS build
# Every following command runs inside /app
WORKDIR /app
# Copy only the dependency manifests first, so Docker can cache the install step
COPY package.json package-lock.json ./
# Install the exact versions from package-lock.json (including dev dependencies)
RUN npm ci
# Copy the TypeScript configuration files
COPY tsconfig.json tsconfig.build.json ./
# Copy the source code
COPY src ./src
# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# ---- Stage 2: runtime -------------------------------------------------------
# Start again from a clean Node.js image
FROM node:24-alpine AS runtime
# Run Express in production mode
ENV NODE_ENV=production
# Working directory of the app
WORKDIR /app
# Dependency manifests again
COPY package.json package-lock.json ./
# Install production dependencies only, then delete npm's cache to save space
RUN npm ci --omit=dev && npm cache clean --force
# Take the compiled JavaScript from the build stage
COPY --from=build /app/dist ./dist
# Create the folder for uploaded posters and give it to the unprivileged "node" user
RUN mkdir -p uploads && chown -R node:node /app/uploads
# Never run the server as root (basic container security)
USER node
# Document the port the API listens on
EXPOSE 5000
# Docker checks this URL to know when the API is ready/healthy
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
# Start the server
CMD ["node", "dist/index.js"]
