#!/bin/bash

# ===========================================
# Jware-Trader8 Test Script
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
TEST_MODE=${1:-all}
COVERAGE_THRESHOLD=${COVERAGE_THRESHOLD:-95}
PARALLEL=${PARALLEL:-true}
WATCH_MODE=${WATCH_MODE:-false}

# Test categories
RUN_UNIT_TESTS=true
RUN_INTEGRATION_TESTS=true
RUN_E2E_TESTS=false
GENERATE_COVERAGE=true
FAIL_ON_COVERAGE=true

# Display test configuration
show_config() {
    echo "========================================"
    echo "  Jware-Trader8 Test Runner"
    echo "========================================"
    echo "Test mode: $TEST_MODE"
    echo "Coverage threshold: $COVERAGE_THRESHOLD%"
    echo "Parallel execution: $PARALLEL"
    echo "Watch mode: $WATCH_MODE"
    echo "Unit tests: $RUN_UNIT_TESTS"
    echo "Integration tests: $RUN_INTEGRATION_TESTS"
    echo "E2E tests: $RUN_E2E_TESTS"
    echo "========================================"
    echo
}

# Setup test environment
setup_test_env() {
    log_info "Setting up test environment..."
    
    # Set test environment variables
    export NODE_ENV=test
    export LOG_LEVEL=error
    export DATABASE_URL=:memory:
    export REDIS_URL=redis://localhost:6379/1
    
    # Create test directories
    mkdir -p data/test
    mkdir -p logs/test
    mkdir -p coverage
    
    # Copy test configuration if it doesn't exist
    if [ ! -f ".env.test" ]; then
        cat > .env.test << 'EOF'
NODE_ENV=test
LOG_LEVEL=error
DATABASE_URL=:memory:
REDIS_URL=redis://localhost:6379/1
ALPACA_API_KEY=test_key
ALPACA_SECRET_KEY=test_secret
POLYGON_API_KEY=test_polygon_key
ENCRYPTION_KEY=test_encryption_key_12345678901234
JWT_SECRET=test_jwt_secret
USE_SANDBOX_MODE=true
MOCK_MARKET_DATA=true
EOF
        log_success "Created .env.test file"
    fi
    
    log_success "Test environment ready"
}

# Check test dependencies
check_test_deps() {
    log_info "Checking test dependencies..."
    
    # Check if Redis is available for integration tests
    if [ "$RUN_INTEGRATION_TESTS" = "true" ]; then
        if ! command -v redis-cli >/dev/null 2>&1; then
            log_warning "Redis CLI not found. Integration tests may fail."
        else
            # Try to ping Redis
            if ! redis-cli -p 6379 ping >/dev/null 2>&1; then
                log_warning "Redis server not responding on port 6379"
                log_info "You can start Redis with: redis-server"
            else
                log_success "Redis server is available"
            fi
        fi
    fi
    
    log_success "Dependencies checked"
}

# Run unit tests
run_unit_tests() {
    if [ "$RUN_UNIT_TESTS" = "false" ]; then
        log_info "Skipping unit tests"
        return
    fi
    
    log_info "Running unit tests..."
    
    local jest_args="--testPathPattern='(test|spec)\.ts$' --testPathIgnorePatterns='/integration/|/e2e/'"
    
    if [ "$PARALLEL" = "true" ]; then
        jest_args="$jest_args --runInBand=false"
    else
        jest_args="$jest_args --runInBand"
    fi
    
    if [ "$WATCH_MODE" = "true" ]; then
        jest_args="$jest_args --watch"
    fi
    
    if [ "$GENERATE_COVERAGE" = "true" ]; then
        jest_args="$jest_args --coverage --coverageDirectory=coverage/unit"
    fi
    
    # Run unit tests for each package
    local packages=("types" "utils" "core" "providers" "strategies" "backtesting" "database" "cli")
    
    for package in "${packages[@]}"; do
        if [ -d "packages/$package" ]; then
            log_info "Running unit tests for $package..."
            cd "packages/$package"
            npx jest $jest_args || {
                log_error "Unit tests failed for $package"
                cd - > /dev/null
                exit 1
            }
            cd - > /dev/null
            log_success "$package unit tests passed"
        fi
    done
    
    log_success "All unit tests passed"
}

# Run integration tests
run_integration_tests() {
    if [ "$RUN_INTEGRATION_TESTS" = "false" ]; then
        log_info "Skipping integration tests"
        return
    fi
    
    log_info "Running integration tests..."
    
    # Create integration test directory if it doesn't exist
    mkdir -p tests/integration
    
    local jest_args="--testPathPattern='integration.*\.(test|spec)\.ts$'"
    
    if [ "$GENERATE_COVERAGE" = "true" ]; then
        jest_args="$jest_args --coverage --coverageDirectory=coverage/integration"
    fi
    
    # Set integration test timeout
    jest_args="$jest_args --testTimeout=30000"
    
    # Run integration tests
    if [ -d "tests/integration" ] && [ "$(ls -A tests/integration)" ]; then
        npx jest $jest_args || {
            log_error "Integration tests failed"
            exit 1
        }
        log_success "Integration tests passed"
    else
        log_warning "No integration tests found in tests/integration/"
    fi
}

# Run end-to-end tests
run_e2e_tests() {
    if [ "$RUN_E2E_TESTS" = "false" ]; then
        log_info "Skipping E2E tests"
        return
    fi
    
    log_info "Running end-to-end tests..."
    
    # Create E2E test directory if it doesn't exist
    mkdir -p tests/e2e
    
    # Build the application first
    log_info "Building application for E2E tests..."
    npm run build >/dev/null 2>&1 || {
        log_error "Build failed, cannot run E2E tests"
        exit 1
    }
    
    local jest_args="--testPathPattern='e2e.*\.(test|spec)\.ts$' --testTimeout=60000"
    
    # Run E2E tests
    if [ -d "tests/e2e" ] && [ "$(ls -A tests/e2e)" ]; then
        npx jest $jest_args || {
            log_error "E2E tests failed"
            exit 1
        }
        log_success "E2E tests passed"
    else
        log_warning "No E2E tests found in tests/e2e/"
    fi
}

# Generate coverage report
generate_coverage_report() {
    if [ "$GENERATE_COVERAGE" = "false" ]; then
        log_info "Skipping coverage report generation"
        return
    fi
    
    log_info "Generating comprehensive coverage report..."
    
    # Merge coverage reports if multiple exist
    if [ -d "coverage/unit" ] && [ -d "coverage/integration" ]; then
        npx nyc merge coverage/unit coverage/integration coverage/combined.json
        npx nyc report --reporter=html --reporter=lcov --reporter=text --temp-dir=coverage/combined --report-dir=coverage/final
    elif [ -d "coverage/unit" ]; then
        cp -r coverage/unit coverage/final
    elif [ -d "coverage/integration" ]; then
        cp -r coverage/integration coverage/final
    fi
    
    # Generate text summary
    if [ -f "coverage/final/lcov.info" ]; then
        npx lcov-summary coverage/final/lcov.info > coverage/summary.txt
        log_success "Coverage report generated: coverage/final/index.html"
    fi
}

# Check coverage thresholds
check_coverage_thresholds() {
    if [ "$FAIL_ON_COVERAGE" = "false" ]; then
        log_info "Skipping coverage threshold check"
        return
    fi
    
    log_info "Checking coverage thresholds..."
    
    if [ -f "coverage/final/lcov.info" ]; then
        # Extract coverage percentage using genhtml (if available)
        if command -v genhtml >/dev/null 2>&1; then
            local coverage_pct=$(genhtml -q coverage/final/lcov.info -o /tmp/coverage-check 2>&1 | grep -o '[0-9.]*%' | head -1 | sed 's/%//')
            
            if [ -n "$coverage_pct" ]; then
                log_info "Overall coverage: ${coverage_pct}%"
                
                if (( $(echo "$coverage_pct < $COVERAGE_THRESHOLD" | bc -l) )); then
                    log_error "Coverage ${coverage_pct}% is below threshold ${COVERAGE_THRESHOLD}%"
                    exit 1
                else
                    log_success "Coverage threshold met: ${coverage_pct}% >= ${COVERAGE_THRESHOLD}%"
                fi
            else
                log_warning "Could not parse coverage percentage"
            fi
        else
            log_warning "genhtml not available, skipping coverage threshold check"
        fi
    else
        log_warning "No coverage data found for threshold check"
    fi
}

# Performance testing
run_performance_tests() {
    log_info "Running performance tests..."
    
    # Create performance test if it doesn't exist
    if [ ! -f "tests/performance/benchmark.test.ts" ]; then
        mkdir -p tests/performance
        cat > tests/performance/benchmark.test.ts << 'EOF'
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  test('should process 1000 market data points within time limit', async () => {
    const startTime = performance.now();
    
    // Simulate processing 1000 data points
    const data = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: Date.now() + i * 1000,
      price: 50000 + Math.random() * 1000,
      volume: Math.random() * 100
    }));
    
    // Process data (mock processing)
    data.forEach(point => {
      // Simple calculation to simulate work
      Math.sqrt(point.price * point.volume);
    });
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(1000); // Should complete in less than 1 second
  });

  test('should handle concurrent strategy executions', async () => {
    const startTime = performance.now();
    
    // Simulate concurrent strategy executions
    const promises = Array.from({ length: 10 }, async (_, i) => {
      return new Promise(resolve => {
        setTimeout(() => resolve(i), Math.random() * 100);
      });
    });
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(500); // Should complete in less than 500ms
  });
});
EOF
        log_success "Created performance test template"
    fi
    
    # Run performance tests
    npx jest --testPathPattern='performance.*\.(test|spec)\.ts$' --testTimeout=10000
    
    log_success "Performance tests completed"
}

# Generate test report
generate_test_report() {
    log_info "Generating test report..."
    
    local report_file="test-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "========================================"
        echo "Jware-Trader8 Test Report"
        echo "========================================"
        echo "Test run time: $(date)"
        echo "Test mode: $TEST_MODE"
        echo "Node version: $(node --version)"
        echo "Jest version: $(npx jest --version)"
        echo
        echo "Test Results:"
        echo "========================================"
        
        if [ -f "coverage/summary.txt" ]; then
            echo "Coverage Summary:"
            cat coverage/summary.txt
            echo
        fi
        
        echo "Test Files Executed:"
        find packages -name "*.test.ts" -o -name "*.spec.ts" | wc -l | xargs echo "Unit test files:"
        find tests -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l | xargs echo "Integration/E2E test files:"
        
        echo
        echo "========================================"
    } > "$report_file"
    
    echo "Test report saved to: $report_file"
    cat "$report_file"
}

# Cleanup test artifacts
cleanup_tests() {
    log_info "Cleaning up test artifacts..."
    
    # Remove test databases
    rm -f data/test/*.db
    
    # Clean test logs
    rm -f logs/test/*.log
    
    # Clean temporary test files
    find . -name "*.test.tmp" -delete 2>/dev/null || true
    
    log_success "Test cleanup completed"
}

# Main test function
main() {
    show_config
    setup_test_env
    check_test_deps
    
    case $TEST_MODE in
        unit)
            RUN_INTEGRATION_TESTS=false
            RUN_E2E_TESTS=false
            run_unit_tests
            ;;
        integration)
            RUN_UNIT_TESTS=false
            RUN_E2E_TESTS=false
            run_integration_tests
            ;;
        e2e)
            RUN_UNIT_TESTS=false
            RUN_INTEGRATION_TESTS=false
            RUN_E2E_TESTS=true
            run_e2e_tests
            ;;
        performance)
            RUN_UNIT_TESTS=false
            RUN_INTEGRATION_TESTS=false
            RUN_E2E_TESTS=false
            run_performance_tests
            ;;
        all|*)
            run_unit_tests
            run_integration_tests
            run_e2e_tests
            run_performance_tests
            ;;
    esac
    
    generate_coverage_report
    check_coverage_thresholds
    generate_test_report
    cleanup_tests
    
    echo
    echo "========================================"
    log_success "All tests completed successfully!"
    echo "========================================"
    echo
    if [ -f "coverage/final/index.html" ]; then
        echo "Coverage report: coverage/final/index.html"
    fi
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            TEST_MODE=unit
            shift
            ;;
        --integration)
            TEST_MODE=integration
            shift
            ;;
        --e2e)
            TEST_MODE=e2e
            shift
            ;;
        --performance)
            TEST_MODE=performance
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --no-coverage)
            GENERATE_COVERAGE=false
            FAIL_ON_COVERAGE=false
            shift
            ;;
        --threshold)
            COVERAGE_THRESHOLD=$2
            shift 2
            ;;
        --sequential)
            PARALLEL=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS] [TEST_MODE]"
            echo "Test modes: all (default), unit, integration, e2e, performance"
            echo "Options:"
            echo "  --unit           Run only unit tests"
            echo "  --integration    Run only integration tests"
            echo "  --e2e           Run only end-to-end tests"
            echo "  --performance   Run only performance tests"
            echo "  --watch         Run in watch mode"
            echo "  --no-coverage   Skip coverage generation"
            echo "  --threshold N   Set coverage threshold (default: 95)"
            echo "  --sequential    Run tests sequentially"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            TEST_MODE=$1
            shift
            ;;
    esac
done

# Run main function
main "$@"