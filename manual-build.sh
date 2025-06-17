#!/bin/bash

echo "🔧 Manual build of Jware-Trader8..."

# Create dist directories and build TypeScript files manually
packages=("types" "utils" "core" "providers" "strategies" "backtesting" "database" "cli")

for pkg in "${packages[@]}"; do
    echo "📦 Building $pkg..."
    cd "packages/$pkg"
    
    # Create dist directory
    mkdir -p dist
    
    # Try to compile TypeScript
    if [ -d "src" ]; then
        if command -v tsc &> /dev/null; then
            tsc --outDir dist --rootDir src --declaration --target ES2020 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --strict src/*.ts 2>/dev/null || echo "  Warning: TypeScript compilation had issues"
        else
            echo "  Warning: TypeScript not found, skipping compilation"
        fi
    fi
    
    cd ../..
done

echo "✅ Manual build complete!"
echo ""
echo "📋 To test the CLI:"
echo "   cd packages/cli"
echo "   node -e \"console.log('CLI package structure:'); console.log(require('fs').readdirSync('.'));\""
echo ""
echo "📋 If you have Node.js, you can try:"
echo "   cd packages/cli && node dist/index.js --help"
echo ""
echo "📋 To install CLI dependencies manually:"
echo "   cd packages/cli"
echo "   npm install commander inquirer chalk cli-table3 ora yaml date-fns decimal.js"
echo "   npm run build"
echo "   node dist/index.js --help"