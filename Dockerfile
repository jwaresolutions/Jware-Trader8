# Multi-stage build for production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package.json ./packages/*/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S trader -u 1001 -G nodejs

# Copy built application from builder stage
COPY --from=builder --chown=trader:nodejs /app/dist ./dist
COPY --from=builder --chown=trader:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=trader:nodejs /app/package.json ./
COPY --from=builder --chown=trader:nodejs /app/packages/*/package.json ./packages/*/

# Create necessary directories
RUN mkdir -p data logs config && \
    chown -R trader:nodejs data logs config

# Switch to non-root user
USER trader

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/packages/cli/index.js", "server"]