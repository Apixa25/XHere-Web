#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 XHere Mobile Development Helper');
console.log('====================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json') || !fs.existsSync('capacitor.config.ts')) {
  console.error('❌ Please run this script from the frontend directory');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const target = args[1] || 'auto'; // auto, emulator, device

const commands = {
  'dev': () => startDevelopmentMode(),
  'build': () => buildForMobile(),
  'clean': () => cleanAndRebuild(),
  'emulator': () => runOnEmulator(),
  'device': () => runOnPhysicalDevice(),
  'help': () => showHelp()
};

function showHelp() {
  console.log(`
📱 Available Commands:
  dev        - Start development mode with live reload
  build      - Build and sync for mobile
  clean      - Clean and rebuild everything
  emulator   - Run on Android emulator
  device     - Run on physical device
  help       - Show this help

💡 Quick Start:
  npm run mobile:dev    # Start development
  npm run mobile:live   # Just live reload (after first build)
  `);
}

function getHostForTarget(target) {
  switch (target) {
    case 'emulator':
      return '10.0.2.2'; // Android emulator localhost
    case 'device':
      return getLocalIP(); // Your computer's IP for physical device
    default:
      return '10.0.2.2'; // Default to emulator
  }
}

function getLocalIP() {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const interface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (interface.family === 'IPv4' && !interface.internal) {
          return interface.address;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not determine local IP, using default');
  }
  
  return '192.168.1.100'; // Fallback IP
}

function startDevelopmentMode() {
  console.log('🔨 Building for mobile...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('📱 Copying to Android...');
    execSync('npx cap copy android', { stdio: 'inherit' });
    
    const host = getHostForTarget(target);
    console.log(`🚀 Starting live reload on ${host}...`);
    execSync(`npx cap run android -l --host=${host}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error in development mode:', error.message);
  }
}

function buildForMobile() {
  console.log('🔨 Building for mobile...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('📱 Copying to Android...');
    execSync('npx cap copy android', { stdio: 'inherit' });
    console.log('🔄 Syncing with Android...');
    execSync('npx cap sync android', { stdio: 'inherit' });
    console.log('✅ Mobile build complete!');
  } catch (error) {
    console.error('❌ Build error:', error.message);
  }
}

function cleanAndRebuild() {
  console.log('🧹 Cleaning Android build...');
  try {
    execSync('npx cap clean android', { stdio: 'inherit' });
    buildForMobile();
  } catch (error) {
    console.error('❌ Clean error:', error.message);
  }
}

function runOnEmulator() {
  console.log('📱 Running on Android emulator...');
  try {
    const host = getHostForTarget('emulator');
    execSync(`npx cap run android -l --host=${host} --target=Pixel_7_API_34`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Emulator error:', error.message);
    console.log('💡 Make sure you have an Android emulator running');
  }
}

function runOnPhysicalDevice() {
  console.log('📱 Running on physical device...');
  try {
    const host = getHostForTarget('device');
    console.log(`🌐 Using host IP: ${host}`);
    execSync(`npx cap run android -l --host=${host} --target=physical`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Device error:', error.message);
    console.log('💡 Make sure your device is connected and USB debugging is enabled');
  }
}

// Execute command
if (commands[command]) {
  commands[command]();
} else {
  console.log('❌ Unknown command:', command);
  showHelp();
} 