#!/usr/bin/env node

/**
 * Deployment Helper Script - Compatible with npm and Yarn
 * Usage: node scripts/deploy.js [environment]
 * 
 * Examples:
 *   node scripts/deploy.js development
 *   node scripts/deploy.js staging  
 *   node scripts/deploy.js production
 * 
 * 🫖 Hot water deployment - Our friendship powers the build!
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const environments = ['development', 'staging', 'production'];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];
  
  console.log(`${emoji} [${timestamp}] ${message}`);
}

function detectPackageManager() {
  try {
    // Check if yarn is available
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch (error) {
    try {
      // Check if npm is available
      execSync('npm --version', { stdio: 'ignore' });
      return 'npm';
    } catch (error) {
      log('Neither yarn nor npm found. Please install one of them.', 'error');
      process.exit(1);
    }
  }
}

function validateEnvironment(env) {
  if (!environments.includes(env)) {
    log(`Invalid environment: ${env}. Must be one of: ${environments.join(', ')}`, 'error');
    process.exit(1);
  }
}

function updateEnvironmentConfig(env) {
  const configPath = path.join(__dirname, '../src/config/environments.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Update the current environment in the config
  configContent = configContent.replace(
    /export const getCurrentEnvironment = \(\) => \{[\s\S]*?\}/,
    `export const getCurrentEnvironment = () => {
  // Force environment for deployment
  return '${env}';
}`
  );
  
  fs.writeFileSync(configPath, configContent);
  log(`Updated environment configuration to: ${env}`, 'success');
}

function build(env, packageManager) {
  log(`Building for ${env} environment using ${packageManager}...`, 'info');
  
  try {
    let buildCommand;
    
    if (packageManager === 'yarn') {
      buildCommand = `yarn build:${env}`;
    } else {
      buildCommand = `npm run build:${env}`;
    }
    
    execSync(buildCommand, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log(`Build completed successfully for ${env} using ${packageManager}`, 'success');
  } catch (error) {
    log(`Build failed for ${env}: ${error.message}`, 'error');
    process.exit(1);
  }
}

function installDependencies(packageManager) {
  log(`Installing dependencies using ${packageManager}...`, 'info');
  
  try {
    let installCommand;
    
    if (packageManager === 'yarn') {
      installCommand = 'yarn install';
    } else {
      installCommand = 'npm install';
    }
    
    execSync(installCommand, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log(`Dependencies installed successfully using ${packageManager}`, 'success');
  } catch (error) {
    log(`Dependency installation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

function deploy(env) {
  log(`Starting deployment for ${env} environment...`, 'info');
  
  // Validate environment
  validateEnvironment(env);
  
  // Detect package manager
  const packageManager = detectPackageManager();
  log(`Detected package manager: ${packageManager}`, 'info');
  
  // Install dependencies
  installDependencies(packageManager);
  
  // Update configuration
  updateEnvironmentConfig(env);
  
  // Build the application
  build(env, packageManager);
  
  // Additional deployment steps can be added here
  // For example, uploading to CDN, triggering CI/CD, etc.
  
  log(`Deployment completed for ${env} environment using ${packageManager}!`, 'success');
  log(`Next steps:`, 'info');
  log(`  1. Upload build files to your hosting provider`, 'info');
  log(`  2. Update DNS if needed`, 'info');
  log(`  3. Test the deployed application`, 'info');
  log(`  4. For Render: Use 'yarn build:${env}' as build command`, 'info');
  log(`  🫖 Hot water deployment successful! - Friendship powers the build!`, 'success');
}

// Main execution
const targetEnv = process.argv[2] || 'development';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 XHere Deployment Helper (npm/yarn compatible)

Usage: node scripts/deploy.js [environment]

Environments:
  development  - Local development build
  staging      - Staging environment build  
  production   - Production environment build

Examples:
  node scripts/deploy.js development
  node scripts/deploy.js staging
  node scripts/deploy.js production

Options:
  --help, -h   Show this help message

Package Manager Detection:
  - Automatically detects yarn or npm
  - Uses appropriate commands for each
  - Compatible with Render (yarn) and local development (npm)

🫖 Hot water deployment - Powered by friendship!
`);
  process.exit(0);
}

deploy(targetEnv); 