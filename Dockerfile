# === Stage 1: Build & ffmpeg layer ===
FROM node:20-bullseye AS builder

WORKDIR /app

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# === Stage 2: Slim final image ===
FROM node:20-slim

WORKDIR /app

# Copy node_modules and code from builder
COPY --from=builder /app /app

# ffmpeg binaries from builder
COPY --from=builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=builder /usr/lib /usr/lib
COPY --from=builder /lib /lib

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "server.js"]
