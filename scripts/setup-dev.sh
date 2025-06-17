#!/bin/bash

# ===========================================
# Jware-Trader8 Development Setup Script
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            log_success "Node.js version $NODE_VERSION is compatible"
        else
            log_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        log_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    # Check npm version
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm version $NPM_VERSION found"
    else
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker (optional but recommended)
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker version $DOCKER_VERSION found"
        DOCKER_AVAILABLE=true
    else
        log_warning "Docker is not installed. Some features may not work."
        DOCKER_AVAILABLE=false
    fi
    
    # Check Docker Compose (optional)
    if command_exists docker-compose || command_exists "docker compose"; then
        log_success "Docker Compose found"
        COMPOSE_AVAILABLE=true
    else
        log_warning "Docker Compose is not installed"
        COMPOSE_AVAILABLE=false
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p data/cache
    mkdir -p data/backtest-results
    mkdir -p data/logs
    mkdir -p config
    mkdir -p strategies/examples
    mkdir -p strategies/user
    mkdir -p logs
    
    log_success "Directories created"
}

# Install dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    # Clean install
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

# Setup environment configuration
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Copy .env.example to .env if it doesn't exist
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_success "Created .env file from .env.example"
        log_warning "Please edit .env file with your actual configuration values"
    else
        log_info ".env file already exists"
    fi
}

# Setup configuration files
setup_config() {
    log_info "Setting up configuration files..."
    
    # Create default configuration
    cat > config/default.json << 'EOF'
{
  "app": {
    "name": "Jware-Trader8",
    "version": "1.0.0",
    "port": 3000
  },
  "logging": {
    "level": "info",
    "file": "./logs/trader.log",
    "maxSize": "10MB",
    "maxFiles": 5
  },
  "trading": {
    "defaultPositionSize": 0.1,
    "maxDailyLoss": 0.05,
    "riskManagementEnabled": true,
    "maxOpenPositions": 10
  },
  "database": {
    "type": "sqlite",
    "filename": "./data/trader.db"
  },
  "cache": {
    "redis": {
      "url": "redis://localhost:6379",
      "db": 0
    }
  }
}
EOF

    # Create development configuration
    cat > config/development.json << 'EOF'
{
  "logging": {
    "level": "debug"
  },
  "trading": {
    "sandboxMode": true,
    "mockData": false
  },
  "database": {
    "logging": true
  }
}
EOF

    # Create test configuration
    cat > config/test.json << 'EOF'
{
  "logging": {
    "level": "error",
    "file": "./logs/test.log"
  },
  "trading": {
    "sandboxMode": true,
    "mockData": true
  },
  "database": {
    "type": "sqlite",
    "filename": ":memory:"
  }
}
EOF

    # Create production configuration
    cat > config/production.json << 'EOF'
{
  "logging": {
    "level": "warn"
  },
  "trading": {
    "sandboxMode": false,
    "mockData": false
  },
  "database": {
    "logging": false
  }
}
EOF

    log_success "Configuration files created"
}

# Build packages
build_packages() {
    log_info "Building TypeScript packages..."
    
    npm run build
    
    log_success "Packages built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests to verify setup..."
    
    npm test
    
    log_success "All tests passed"
}

# Setup Docker environment (if available)
setup_docker() {
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
        log_info "Setting up Docker development environment..."
        
        # Build development image
        docker-compose build trader
        
        log_success "Docker development environment ready"
        log_info "Use 'docker-compose up -d' to start services"
    else
        log_warning "Skipping Docker setup (Docker/Docker Compose not available)"
    fi
}

# Setup git hooks
setup_git_hooks() {
    if [ -d ".git" ]; then
        log_info "Setting up git hooks..."
        
        # Install husky if not already installed
        if ! npm list husky >/dev/null 2>&1; then
            npm install --save-dev husky
        fi
        
        # Setup husky
        npx husky install
        
        # Add pre-commit hook
        npx husky add .husky/pre-commit "npm run lint && npm run test && npm run build"
        
        # Add commit-msg hook for conventional commits
        npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
        
        log_success "Git hooks configured"
    else
        log_warning "Not a git repository. Skipping git hooks setup."
    fi
}

# Generate example strategy
create_example_strategy() {
    log_info "Creating example strategy..."
    
    cat > strategies/examples/sma_crossover.yaml << 'EOF'
name: "Simple Moving Average Crossover"
description: "Basic SMA crossover strategy for demonstration"
version: "1.0.0"

parameters:
  symbol: "{{ symbol | default('BTCUSD') }}"
  position_size: "{{ position_size | default(0.1) }}"
  fast_period: 10
  slow_period: 20

indicators:
  - name: "sma_fast"
    type: "SMA"
    period: "{{ parameters.fast_period }}"
    
  - name: "sma_slow" 
    type: "SMA"
    period: "{{ parameters.slow_period }}"

signals:
  buy:
    - condition: "sma_fast > sma_slow AND sma_fast[-1] <= sma_slow[-1]"
      action: "BUY"
      quantity: "{{ parameters.position_size }}"
      
  sell:
    - condition: "sma_fast < sma_slow AND sma_fast[-1] >= sma_slow[-1]"
      action: "SELL"
      quantity: "{{ parameters.position_size }}"

risk_management:
  stop_loss: 0.02
  take_profit: 0.04
  max_position_size: 0.2
EOF

    log_success "Example strategy created"
}

# Main setup function
main() {
    echo "========================================"
    echo "  Jware-Trader8 Development Setup"
    echo "========================================"
    echo
    
    check_prerequisites
    create_directories
    install_dependencies
    setup_environment
    setup_config
    build_packages
    run_tests
    setup_docker
    setup_git_hooks
    create_example_strategy
    
    echo
    echo "========================================"
    log_success "Development environment setup complete!"
    echo "========================================"
    echo
    echo "Next steps:"
    echo "1. Edit .env file with your API keys and configuration"
    echo "2. Start development environment:"
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "   - With Docker: docker-compose up -d"
    fi
    echo "   - Without Docker: npm run dev"
    echo "3. Run CLI: npm run cli -- --help"
    echo "4. Run tests: npm test"
    echo
    echo "Documentation:"
    echo "- Project structure: docs/PROJECT_STRUCTURE.md"
    echo "- Implementation guide: docs/IMPLEMENTATION_GUIDE.md"
    echo "- Deployment guide: docs/deployment_guide.md"
    echo
}

# Run main function
main "$@"