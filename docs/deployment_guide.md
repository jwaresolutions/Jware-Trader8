# Jware-Trader8 Deployment Guide

## Overview

This guide covers the complete deployment infrastructure for Jware-Trader8, including development environment setup, CI/CD pipelines, and production deployment procedures.

**Infrastructure Status**: ✅ COMPLETE - All development and CI/CD infrastructure is ready for use.

## Quick Start

### Prerequisites Verification
```bash
# Check required tools
node --version  # Should be 18+
npm --version   # Should be 9+
docker --version
docker-compose --version
```

### Immediate Setup
```bash
# 1. Clone and setup
git clone <repository-url>
cd jware-trader8

# 2. Run automated setup
./scripts/setup-dev.sh

# 3. Start development environment
docker-compose up -d

# 4. Verify installation
npm test
npm run build
```

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd jware-trader8

# Run development setup script
./scripts/setup-dev.sh

# Start development environment
docker-compose up -d
```

### Manual Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Start development mode
npm run dev
```

## Docker Development Environment

### Configuration

The development environment uses Docker Compose with the following services:

- **trader**: Main application container
- **redis**: Caching and session storage
- **postgres**: Database (optional, uses SQLite by default)

### Services Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  trader:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - redis
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    
volumes:
  redis_data:
```

### Development Scripts

All development scripts are located in the [`scripts/`](../scripts/) directory:

- [`setup-dev.sh`](../scripts/setup-dev.sh): Complete development environment setup
- [`build.sh`](../scripts/build.sh): Production build with optimizations
- [`test.sh`](../scripts/test.sh): Run all tests with coverage
- [`dev-watch.sh`](../scripts/dev-watch.sh): Development watch mode

## Environment Configuration

### Environment Variables

Copy [`.env.example`](.env.example) to `.env` and configure:

```bash
# Application
NODE_ENV=development
LOG_LEVEL=info

# API Keys (encrypted in production)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
POLYGON_API_KEY=your_polygon_api_key

# Database
DATABASE_URL=./data/trader.db
REDIS_URL=redis://localhost:6379

# Security
ENCRYPTION_KEY=your_32_character_encryption_key
JWT_SECRET=your_jwt_secret

# Trading Configuration
DEFAULT_POSITION_SIZE=0.1
MAX_DAILY_LOSS=0.05
RISK_MANAGEMENT_ENABLED=true
```

### Configuration Files

Environment-specific configurations in [`config/`](../config/):

- [`default.json`](../config/default.json): Base configuration
- [`development.json`](../config/development.json): Development overrides
- [`production.json`](../config/production.json): Production settings
- [`test.json`](../config/test.json): Test environment settings

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Code Quality Checks**
   - ESLint and Prettier formatting
   - TypeScript compilation
   - Security audit (npm audit)

2. **Testing**
   - Unit tests with coverage reporting
   - Integration tests
   - E2E tests for CLI commands

3. **Build & Deploy**
   - Production build optimization
   - Docker image creation
   - Deployment to staging/production

### Workflow Configuration

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npm run type-check
      
      - name: Security audit
        run: npm audit --audit-level high

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          ALPACA_API_KEY: ${{ secrets.ALPACA_TEST_KEY }}
          POLYGON_API_KEY: ${{ secrets.POLYGON_TEST_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: [quality-checks, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build packages
        run: npm run build:prod
      
      - name: Build Docker image
        run: docker build -t jware-trader8:${{ github.sha }} .
```

## Production Deployment

### Docker Production Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/*/package.json ./packages/*/
RUN npm ci --only=production

COPY . .
RUN npm run build:prod

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S trader -u 1001

WORKDIR /app
COPY --from=builder --chown=trader:nodejs /app/dist ./dist
COPY --from=builder --chown=trader:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=trader:nodejs /app/package.json ./

USER trader

EXPOSE 3000

CMD ["node", "dist/packages/cli/index.js", "server"]
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jware-trader8
  labels:
    app: jware-trader8
spec:
  replicas: 2
  selector:
    matchLabels:
      app: jware-trader8
  template:
    metadata:
      labels:
        app: jware-trader8
    spec:
      containers:
      - name: trader
        image: jware-trader8:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        envFrom:
        - secretRef:
            name: trader-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Security Configuration

### API Key Management

API keys are encrypted using AES-256 encryption:

```typescript
// Handled by packages/utils/src/crypto.ts
import { encrypt, decrypt } from '@jware-trader8/utils';

// Store encrypted API keys
const encryptedKey = encrypt(apiKey, process.env.ENCRYPTION_KEY);

// Retrieve and decrypt when needed
const decryptedKey = decrypt(encryptedKey, process.env.ENCRYPTION_KEY);
```

### Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Encryption**: All API keys encrypted at rest
3. **HTTPS**: All external API calls use HTTPS
4. **Input Validation**: All inputs validated and sanitized
5. **Audit Logging**: All trading actions logged securely

## Monitoring and Logging

### Application Logging

Structured logging using Winston:

```typescript
import { logger } from '@jware-trader8/utils';

logger.info('Trade executed', {
  symbol: 'BTCUSD',
  side: 'BUY',
  quantity: 0.1,
  price: 50000
});
```

### Performance Monitoring

- Build time monitoring
- Test execution time tracking
- Memory usage optimization
- Database query performance

### Health Checks

```typescript
// Health check endpoints
GET /health - Application health status
GET /ready  - Readiness probe for K8s
GET /metrics - Prometheus metrics
```

## Backup and Recovery

### Data Backup

```bash
# Database backup (SQLite)
cp data/trader.db "backup/trader-$(date +%Y%m%d_%H%M%S).db"

# Configuration backup
tar -czf "backup/config-$(date +%Y%m%d_%H%M%S).tar.gz" config/
```

### Recovery Procedures

1. **Database Recovery**: Restore from latest backup
2. **Configuration Recovery**: Restore config files
3. **API Key Recovery**: Re-encrypt with new keys if needed

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors: `npm run type-check`
   - Verify dependencies: `npm ls`
   - Clear cache: `npm run clean && npm install`

2. **Test Failures**
   - Run specific tests: `npm test -- --testPathPattern=<pattern>`
   - Check test environment: Review `.env.test`
   - Mock API responses: Verify mock data

3. **Docker Issues**
   - Rebuild images: `docker-compose build --no-cache`
   - Check logs: `docker-compose logs trader`
   - Volume permissions: Ensure proper file permissions

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with debugging
npm run dev:debug
```

## Performance Optimization

### Build Optimization

- TypeScript project references for incremental builds
- Parallel package builds where possible
- Optimized Docker layer caching
- Production build minification

### Runtime Optimization

- Connection pooling for database and Redis
- Caching strategies for market data
- Memory-efficient data structures
- Garbage collection optimization

## Version Management

### Release Process

```bash
# Version bump
npm version patch|minor|major

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Publish packages
npm run publish:packages
```

### Changelog Generation

Automated changelog generation using conventional commits:

```bash
npm run changelog
```

This deployment guide ensures a robust, scalable, and secure deployment of Jware-Trader8 across development, staging, and production environments.