# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install Chromium dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Install ts-node globally for running TypeScript directly
RUN npm install -g ts-node typescript

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install production dependencies
RUN npm install --only=production

# Copy built application
COPY --from=build /app/dist ./dist

# Copy source for ts-node fallback
COPY src ./src

# Run the scraper
CMD ["node", "dist/scraper.js"]
