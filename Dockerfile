# Use full Debian-based Node.js image
FROM node:20-bullseye

# Install ffmpeg and clean up
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only necessary files first
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy all remaining source files
COPY . .

# Expose your app port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
