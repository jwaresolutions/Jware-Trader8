#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Jware-Trader8 setup...');

try {
  // First, let's try to install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm install --no-optional', { stdio: 'inherit', cwd: process.cwd() });
  
  // Install each package individually to avoid workspace issues
  const packagesDir = path.join(process.cwd(), 'packages');
  const packages = fs.readdirSync(packagesDir).filter(dir => 
    fs.statSync(path.join(packagesDir, dir)).isDirectory()
  );
  
  console.log('📦 Installing package dependencies...');
  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg);
    if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
      console.log(`   Installing ${pkg}...`);
      try {
        execSync('npm install --no-optional', { stdio: 'inherit', cwd: pkgPath });
      } catch (error) {
        console.warn(`   Warning: Could not install ${pkg} dependencies`);
      }
    }
  }
  
  // Try to build packages in dependency order
  console.log('🔨 Building packages...');
  const buildOrder = ['types', 'utils', 'core', 'providers', 'strategies', 'backtesting', 'database', 'cli'];
  
  for (const pkg of buildOrder) {
    const pkgPath = path.join(packagesDir, pkg);
    if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
      console.log(`   Building ${pkg}...`);
      try {
        execSync('npm run build', { stdio: 'inherit', cwd: pkgPath });
      } catch (error) {
        console.warn(`   Warning: Could not build ${pkg}`);
      }
    }
  }
  
  console.log('✅ Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. npm link packages/cli  # Make CLI globally available');
  console.log('   2. jtrader config set-keys --provider alpaca');
  console.log('   3. jtrader config set-keys --provider polygon');
  console.log('   4. jtrader backtest strategies/examples/sma-crossover.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}