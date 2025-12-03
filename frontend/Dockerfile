FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy static files
COPY index.html .
COPY script.js .
COPY style.css .

# Expose port
EXPOSE 3000

# Serve static files from current directory
CMD ["serve", "-s", ".", "-l", "3000"]