FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Set default port
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]

