# Use official Node.js LTS image
FROM node:20-slim

# Install ffmpeg for video processing (optional but recommended)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (same as your Express server)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
