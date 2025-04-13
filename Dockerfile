# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if you use it)
COPY package*.json ./

# Install app dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# --- Final Image (Smaller and More Secure) ---
FROM node:18-alpine

# Install necessary dependencies for Chromium (headless operation)
RUN apk add --no-cache chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.19/community

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/index.js ./
# COPY --from=builder /app/server.js ./ # Use index.js as per your _ENTRYPOINT
# COPY --from=builder /app/other-files ./ # If you have other necessary files

# Set the environment variable for Puppeteer to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose the port your application listens on (Cloud Run defaults to 8080)
EXPOSE 8080

# Define the command to run your application
CMD ["node", "index.js"]