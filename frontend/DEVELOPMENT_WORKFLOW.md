# 🚀 XHere Development Workflow Guide

## Overview
This guide explains how to work with different environments (development, staging, production) without creating spaghetti code. **Compatible with both npm (local) and Yarn (Render)**.

## 🏗️ Architecture

### Environment Configuration System
- **`src/config/environments.js`** - Centralized environment configurations
- **`src/config/index.js`** - Main configuration that auto-detects environment
- **Auto-detection** - Automatically switches based on hostname

### Package Manager Compatibility
- **Local Development:** npm (package-lock.json)
- **Render Deployment:** Yarn (yarn.lock)
- **Cross-platform:** Uses `cross-env` for environment variables

### Environment Detection Logic
```javascript
// Auto-detection based on hostname:
// localhost, 127.0.0.1, 192.168.* → development
// staging.*, test.* → staging  
// everything else → production
```

## 🛠️ Development Workflow

### 1. Local Development (npm)
```bash
# Start development server (auto-detects localhost)
npm start

# Or explicitly set environment
npm run start:dev
```

**What happens:**
- ✅ API calls go to `http://localhost:3000`
- ✅ Debug mode enabled
- ✅ Hot reloading active
- ✅ Console logging verbose

### 2. Testing Production Build Locally
```bash
# Build for production environment
npm run build:prod

# Serve the production build locally
npx serve -s build
```

**What happens:**
- ✅ API calls go to `https://api.xhere.world`
- ✅ Debug mode disabled
- ✅ Optimized for production

### 3. Staging Environment
```bash
# Build for staging
npm run build:staging

# Or use deployment script
node scripts/deploy.js staging
```

## 🚀 Deployment Workflow

### Local Deployment (npm)
```bash
# Deploy to staging
node scripts/deploy.js staging

# Deploy to production  
node scripts/deploy.js production

# Check current configuration
npm run config:check
```

### Render Deployment (Yarn)
```bash
# Build command for Render
yarn build:prod

# Or use the deployment script (auto-detects yarn)
node scripts/deploy.js production
```

### Manual Deployment Steps
1. **Build for target environment:**
   ```bash
   # Local (npm)
   npm run build:prod
   
   # Render (yarn)
   yarn build:prod
   ```

2. **Upload build files** to your hosting provider

3. **Update DNS** if needed

4. **Test the deployment**

## 🔧 Configuration Management

### Environment Variables Priority
1. **`REACT_APP_*`** environment variables (highest priority)
2. **Auto-detected environment** configuration
3. **Fallback** to development configuration

### Cross-Platform Environment Variables
We use `cross-env` to ensure environment variables work on all platforms:
```json
{
  "scripts": {
    "build:prod": "cross-env REACT_APP_ENVIRONMENT=production react-scripts build"
  }
}
```

### Adding New Configuration
1. **Update `src/config/environments.js`:**
   ```javascript
   export const ENVIRONMENTS = {
     development: {
       // Add your new config here
       NEW_FEATURE: true,
       // ...
     },
     production: {
       // Add production version
       NEW_FEATURE: false,
       // ...
     }
   };
   ```

2. **Update `src/config/index.js`:**
   ```javascript
   const config = {
     // Add to main config
     NEW_FEATURE: envConfig.NEW_FEATURE,
     // ...
   };
   ```

### Environment-Specific Features
```javascript
// In your components
import config from '../config';

if (config.DEBUG_MODE) {
  console.log('Debug info:', data);
}

if (config.NEW_FEATURE) {
  // Show new feature
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. API Calls Going to Wrong URL
**Problem:** App calling localhost in production
**Solution:** Check environment detection in browser console

#### 2. Environment Not Detecting Correctly
**Problem:** Wrong environment selected
**Solution:** 
```bash
# Force environment (npm)
npm run start:prod

# Force environment (yarn)
yarn start:prod
```

#### 3. Build Failing
**Problem:** Build errors
**Solution:**
```bash
# Clear cache and rebuild (npm)
rm -rf node_modules package-lock.json
npm install
npm run build:prod

# Clear cache and rebuild (yarn)
rm -rf node_modules yarn.lock
yarn install
yarn build:prod
```

#### 4. Package Manager Conflicts
**Problem:** Different package managers causing issues
**Solution:**
```bash
# Use deployment script (auto-detects)
node scripts/deploy.js production

# Or manually specify
yarn build:prod  # For Render
npm run build:prod  # For local
```

### Debug Commands
```bash
# Check current environment
npm run config:check

# View build output
npm run build:prod --verbose

# Check environment variables
echo $REACT_APP_ENVIRONMENT

# Check package manager
npm run postinstall
```

## 📋 Best Practices

### ✅ Do's
- ✅ Use environment-specific configurations
- ✅ Test production builds locally before deploying
- ✅ Use the deployment script for consistency
- ✅ Keep environment configurations in sync
- ✅ Add new features with environment flags
- ✅ Use `cross-env` for cross-platform compatibility

### ❌ Don'ts
- ❌ Hardcode URLs in components
- ❌ Use different config systems for different parts
- ❌ Deploy without testing production build
- ❌ Mix development and production configurations
- ❌ Assume npm vs yarn behavior is identical

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build:prod
      
      # Deploy to your hosting provider
      - name: Deploy to Production
        run: |
          # Your deployment commands here
```

### Render Configuration
```yaml
# render.yaml
services:
  - type: web
    name: xhere-frontend
    buildCommand: yarn install && yarn build:prod
    staticPublishPath: ./build
```

## 🎯 Quick Reference

### Development Commands (npm)
```bash
npm start              # Start development server
npm run build:dev      # Build for development
npm run config:check   # Check current config
```

### Production Commands (yarn for Render)
```bash
yarn build:prod        # Build for production
node scripts/deploy.js production  # Deploy to production
```

### Environment Variables
```bash
# Cross-platform (recommended)
npm run start:prod     # Uses cross-env

# Platform-specific
REACT_APP_ENVIRONMENT=production npm start  # npm
REACT_APP_ENVIRONMENT=production yarn start  # yarn
```

---

**🎉 Happy coding! This system ensures you can develop locally with npm while deploying to Render with Yarn seamlessly!** 