# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.18.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Download dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Install necessary dependencies for Chromium (headless operation) AND multimedia codecs
RUN apk add --no-cache chromium \
    --repository=http://dl-cdn.alpinelinux.org/alpine/v3.18/community \
    ffmpeg \
    harfbuzz \
    freetype \
    nss \
    libx11 \
    libxext \
    libxi \
    libglib-2.0 \
    libstdc++

# Set the environment variable for Puppeteer to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 8080

# Run the application.
CMD node index.js