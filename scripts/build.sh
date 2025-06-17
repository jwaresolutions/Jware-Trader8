#!/bin/bash

# ===========================================
# Jware-Trader8 Production Build Script
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

# Configuration
BUILD_MODE=${1:-production}
ENABLE_OPTIMIZATION=${ENABLE_OPTIMIZATION:-true}
GENERATE_SOURCEMAPS=${GENERATE_SOURCEMAPS:-false}
SKIP_TESTS=${SKIP_TESTS:-false}

# Display build configuration
show_config() {
    echo "========================================"
    echo "  Jware-Trader8 Production Build"
    echo "========================================"
    echo "Build mode: $BUILD_MODE"
    echo "Optimization: $ENABLE_OPTIMIZATION"
    echo "Source maps: $GENERATE_SOURCEMAPS"
    echo "Skip tests: $SKIP_TESTS"
    echo "========================================"
    echo
}

# Clean previous builds
clean_build() {
    log_info "Cleaning previous builds..."
    
    # Remove dist directories
    find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    rm -rf dist
    
    # Clean TypeScript build info
    find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
    
    log_success "Build directories cleaned"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Use npm ci for faster, reliable installs
    if [ -f "package-lock.json" ]; then
        npm ci --only=production
    else
        npm install --only=production
    fi
    
    log_success "Dependencies installed"
}

# Type checking
type_check() {
    log_info "Running TypeScript type checking..."
    
    # Run TypeScript compiler in check mode
    npx tsc --noEmit --project tsconfig.json
    
    log_success "Type checking passed"
}

# Lint code
lint_code() {
    log_info "Running code linting..."
    
    npm run lint
    
    log_success "Linting passed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping tests as requested"
        return
    fi
    
    log_info "Running tests..."
    
    # Run tests with coverage
    npm run test:coverage
    
    # Check coverage thresholds
    if [ -f "coverage/lcov-report/index.html" ]; then
        log_success "Test coverage report generated"
    fi
    
    log_success "All tests passed"
}

# Build packages in dependency order
build_packages() {
    log_info "Building packages in dependency order..."
    
    # Build order based on dependencies
    local packages=(
        "packages/types"
        "packages/utils" 
        "packages/core"
        "packages/providers"
        "packages/strategies"
        "packages/backtesting"
        "packages/database"
        "packages/cli"
    )
    
    for package in "${packages[@]}"; do
        if [ -d "$package" ]; then
            log_info "Building $package..."
            
            cd "$package"
            
            # Build the package
            npm run build
            
            # Verify build output
            if [ ! -d "dist" ]; then
                log_error "Build failed for $package - no dist directory"
                exit 1
            fi
            
            cd - > /dev/null
            log_success "$package built successfully"
        else
            log_warning "$package directory not found, skipping"
        fi
    done
}

# Optimize build output
optimize_build() {
    if [ "$ENABLE_OPTIMIZATION" = "false" ]; then
        log_info "Skipping optimization as requested"
        return
    fi
    
    log_info "Optimizing build output..."
    
    # Remove unnecessary files
    find packages -name "dist" -type d -exec find {} -name "*.test.js" -delete \; 2>/dev/null || true
    find packages -name "dist" -type d -exec find {} -name "*.spec.js" -delete \; 2>/dev/null || true
    
    # Minify if minifier is available
    if command -v terser >/dev/null 2>&1; then
        log_info "Minifying JavaScript files..."
        find packages -name "dist" -type d -exec find {} -name "*.js" -not -path "*/node_modules/*" \; | while read -r file; do
            terser "$file" --compress --mangle --output "$file.min" && mv "$file.min" "$file"
        done
        log_success "JavaScript files minified"
    fi
    
    log_success "Build optimization completed"
}

# Generate documentation
generate_docs() {
    log_info "Generating API documentation..."
    
    if command -v typedoc >/dev/null 2>&1; then
        npx typedoc --out docs/api packages/*/src/index.ts
        log_success "API documentation generated"
    else
        log_warning "TypeDoc not found, skipping documentation generation"
    fi
}

# Create distribution package
create_distribution() {
    log_info "Creating distribution package..."
    
    # Create dist directory structure
    mkdir -p dist/packages
    
    # Copy built packages
    for package in packages/*/; do
        package_name=$(basename "$package")
        if [ -d "$package/dist" ]; then
            cp -r "$package/dist" "dist/packages/$package_name"
            cp "$package/package.json" "dist/packages/$package_name/"
        fi
    done
    
    # Copy root files
    cp package.json dist/
    cp README.md dist/ 2>/dev/null || true
    cp LICENSE dist/ 2>/dev/null || true
    
    # Create startup script
    cat > dist/start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
node packages/cli/index.js "$@"
EOF
    chmod +x dist/start.sh
    
    log_success "Distribution package created"
}

# Verify build
verify_build() {
    log_info "Verifying build integrity..."
    
    # Check that all expected packages are built
    local expected_packages=("types" "utils" "core" "providers" "strategies" "backtesting" "database" "cli")
    
    for package in "${expected_packages[@]}"; do
        if [ ! -d "packages/$package/dist" ]; then
            log_error "Build verification failed: packages/$package/dist not found"
            exit 1
        fi
        
        # Check for main entry point
        if [ ! -f "packages/$package/dist/index.js" ]; then
            log_warning "Main entry point not found for $package"
        fi
    done
    
    # Test CLI entry point
    if [ -f "packages/cli/dist/index.js" ]; then
        node packages/cli/dist/index.js --version >/dev/null 2>&1 || {
            log_error "CLI entry point test failed"
            exit 1
        }
    fi
    
    log_success "Build verification passed"
}

# Generate build report
generate_report() {
    log_info "Generating build report..."
    
    local report_file="build-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "========================================"
        echo "Jware-Trader8 Build Report"
        echo "========================================"
        echo "Build time: $(date)"
        echo "Build mode: $BUILD_MODE"
        echo "Node version: $(node --version)"
        echo "npm version: $(npm --version)"
        echo
        echo "Package sizes:"
        echo "========================================"
        
        for package in packages/*/; do
            if [ -d "$package/dist" ]; then
                package_name=$(basename "$package")
                size=$(du -sh "$package/dist" | cut -f1)
                echo "$package_name: $size"
            fi
        done
        
        echo
        echo "Total build size: $(du -sh packages/*/dist | tail -n1 | cut -f1)"
        echo
        
        if [ -f "coverage/lcov-report/index.html" ]; then
            echo "Test coverage: Available in coverage/lcov-report/index.html"
        fi
        
        echo "========================================"
    } > "$report_file"
    
    echo "Build report saved to: $report_file"
    cat "$report_file"
}

# Cleanup on error
cleanup_on_error() {
    log_error "Build failed! Cleaning up..."
    # Could add cleanup logic here if needed
}

# Main build function
main() {
    # Set error trap
    trap cleanup_on_error ERR
    
    show_config
    clean_build
    install_dependencies
    type_check
    lint_code
    run_tests
    build_packages
    optimize_build
    generate_docs
    create_distribution
    verify_build
    generate_report
    
    echo
    echo "========================================"
    log_success "Production build completed successfully!"
    echo "========================================"
    echo
    echo "Build artifacts:"
    echo "- Package builds: packages/*/dist/"
    echo "- Distribution: dist/"
    echo "- Documentation: docs/api/"
    echo
    echo "To run the built application:"
    echo "  cd dist && ./start.sh --help"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --no-optimization)
            ENABLE_OPTIMIZATION=false
            shift
            ;;
        --sourcemaps)
            GENERATE_SOURCEMAPS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-tests      Skip running tests"
            echo "  --no-optimization Skip build optimization"
            echo "  --sourcemaps      Generate source maps"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            BUILD_MODE=$1
            shift
            ;;
    esac
done

# Run main function
main "$@"