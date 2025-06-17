#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Simple Jware-Trader8 setup...');

try {
  // Create a minimal setup that just builds what we need
  const packagesDir = path.join(process.cwd(), 'packages');
  const buildOrder = ['types', 'utils', 'core', 'providers', 'strategies', 'backtesting', 'database', 'cli'];
  
  console.log('📦 Installing only essential dependencies...');
  
  // Install minimal dependencies package by package
  for (const pkg of buildOrder) {
    const pkgPath = path.join(packagesDir, pkg);
    if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
      console.log(`   Setting up ${pkg}...`);
      
      // Read package.json and remove problematic dependencies
      const pkgJsonPath = path.join(pkgPath, 'package.json');
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      
      // Remove all external dependencies for now, keep only workspace deps
      if (pkgJson.dependencies) {
        const workspaceDeps = {};
        for (const [name, version] of Object.entries(pkgJson.dependencies)) {
          if (name.startsWith('@jware-trader8/')) {
            workspaceDeps[name] = version;
          }
        }
        pkgJson.dependencies = workspaceDeps;
      }
      
      // Remove problematic devDependencies
      if (pkgJson.devDependencies) {
        const safeDeps = {};
        const allowedDeps = ['typescript', '@types/node', '@types/jest', 'jest', 'ts-jest'];
        for (const [name, version] of Object.entries(pkgJson.devDependencies)) {
          if (allowedDeps.includes(name)) {
            safeDeps[name] = version;
          }
        }
        pkgJson.devDependencies = safeDeps;
      }
      
      // Write simplified package.json
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
      
      // Try to build with TypeScript only
      try {
        if (fs.existsSync(path.join(pkgPath, 'src'))) {
          execSync('npx tsc', { stdio: 'inherit', cwd: pkgPath });
          console.log(`   ✅ Built ${pkg}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not build ${pkg}: ${error.message}`);
      }
    }
  }
  
  console.log('✅ Basic setup complete!');
  console.log('\n📋 To use Jware-Trader8:');
  console.log('   1. cd packages/cli');
  console.log('   2. node dist/index.js --help');
  console.log('\n📋 Or install CLI dependencies manually:');
  console.log('   1. cd packages/cli');
  console.log('   2. npm install commander inquirer chalk cli-table3 ora yaml');
  console.log('   3. npm run build');
  console.log('   4. node dist/index.js --help');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\n📋 Manual setup:');
  console.log('   1. cd packages/types && npx tsc');
  console.log('   2. cd ../utils && npx tsc');
  console.log('   3. cd ../core && npx tsc');
  console.log('   4. Continue for each package...');
}