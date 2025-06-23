# 🤖 AI Assistant Setup Guide

## Overview
This document helps AI assistants understand the XHere project structure, configuration, and development workflow. **Compatible with both npm (local) and Yarn (Render)**.

## 🏗️ Project Structure

```
XHere-Web/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── config/          # Configuration files (AI can modify)
│   │   │   ├── index.js     # Main configuration
│   │   │   ├── environments.js # Environment-specific configs
│   │   │   └── config.template.js # Template for AI reference
│   │   ├── components/      # React components
│   │   └── services/        # API services
│   ├── scripts/             # Build and deployment scripts
│   ├── package.json         # Dependencies and scripts
│   └── render.yaml          # Render deployment configuration
├── backend/                 # Node.js/Express backend
│   ├── config/             # Backend configuration
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   └── server.js           # Main server file
└── docs/                   # Documentation
```

## 🔧 Configuration System

### Environment Detection
The app automatically detects environment based on hostname:
- `localhost`, `127.0.0.1`, `192.168.*` → **development**
- `staging.*`, `test.*` → **staging**
- Everything else → **production**

### Package Manager Compatibility
- **Local Development:** npm (package-lock.json)
- **Render Deployment:** Yarn (yarn.lock)
- **Cross-platform:** Uses `cross-env` for environment variables

### Configuration Files (AI Can Modify)
1. **`frontend/src/config/environments.js`** - Environment-specific settings
2. **`frontend/src/config/index.js`** - Main configuration logic
3. **`frontend/src/config/config.template.js`** - Template for reference
4. **`frontend/render.yaml`** - Render deployment configuration

### Environment Variables (AI Cannot See)
- `.env`, `.env.local`, `.env.production` - These are ignored for security
- Use `config.template.js` to understand structure
- Create `.env.local` files locally for actual values

## 🚀 Development Workflow

### Commands AI Can Suggest
```bash
# Development (npm)
npm start                    # Start development server
npm run start:dev           # Explicit development mode
npm run build:dev           # Build for development

# Production (yarn for Render)
yarn build:prod             # Build for production
node scripts/deploy.js production  # Deploy to production

# Configuration
npm run config:check        # Check current configuration
```

### Environment Variables to Set
```bash
# Required for development
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_GOOGLE_MAPS_MAP_ID=your_map_id_here

# Optional overrides
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

## 🔒 Security Guidelines

### What AI Can Do
✅ Modify configuration files
✅ Update build scripts
✅ Create deployment helpers
✅ Add new features with environment flags
✅ Update documentation
✅ Configure Render deployment

### What AI Cannot Do
❌ Access actual API keys
❌ See sensitive environment files
❌ Access user uploads or media
❌ See production credentials

### Best Practices
1. **Use templates** - Reference `config.template.js` for structure
2. **Environment flags** - Add feature flags for different environments
3. **Documentation** - Update this file when making changes
4. **Testing** - Suggest testing commands for users
5. **Cross-platform** - Use `cross-env` for environment variables

## 🎯 Common AI Tasks

### Adding New Configuration
1. Update `frontend/src/config/environments.js`
2. Update `frontend/src/config/index.js`
3. Update `frontend/src/config/config.template.js`
4. Update this documentation

### Environment-Specific Features
```javascript
// In components
import config from '../config';

if (config.DEBUG_MODE) {
  console.log('Debug info:', data);
}

if (config.NEW_FEATURE) {
  // Show new feature
}
```

### Deployment Help
```bash
# Build for specific environment (npm)
npm run build:prod

# Build for specific environment (yarn)
yarn build:prod

# Use deployment script (auto-detects package manager)
node scripts/deploy.js production

# Check configuration
npm run config:check
```

### Render Configuration
```yaml
# render.yaml - AI can modify this
services:
  - type: web
    name: xhere-frontend
    buildCommand: yarn install && yarn build:prod
    staticPublishPath: ./build
```

## 📋 File Permissions

### AI Can Modify
- All source code files
- Configuration files
- Build scripts
- Documentation
- Template files
- Render configuration (`render.yaml`)

### AI Cannot Modify
- Environment files (`.env*`)
- User uploads (`uploads/`)
- Build artifacts (`build/`, `dist/`)
- Dependencies (`node_modules/`)

## 🔄 Update Protocol

When making changes:
1. **Update configuration files** first
2. **Test in development** environment
3. **Update documentation** (this file)
4. **Provide clear instructions** for user
5. **Include testing commands**
6. **Consider package manager** (npm vs yarn)

## 🎉 Success Metrics

AI assistance is successful when:
- ✅ User can develop locally without issues
- ✅ Production deployments work correctly on Render
- ✅ Environment switching is seamless
- ✅ Configuration is clear and documented
- ✅ Security is maintained
- ✅ Both npm and yarn work correctly

## 🚀 Render-Specific Considerations

### Build Commands
- **Render uses Yarn** by default
- **Build command:** `yarn install && yarn build:prod`
- **Environment variables** set in Render dashboard

### Environment Variables in Render
```bash
# Set these in Render dashboard
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://api.xhere.world
REACT_APP_GOOGLE_MAPS_API_KEY=your_prod_key
REACT_APP_GOOGLE_CLIENT_ID=your_prod_client_id
REACT_APP_GOOGLE_MAPS_MAP_ID=your_prod_map_id
```

### Local vs Render Testing
```bash
# Test locally (npm)
npm run build:prod
npx serve -s build

# Test on Render (yarn)
yarn build:prod
# Deploy to Render for testing
```

---

**🤖 This document helps AI assistants provide better, more contextual help while maintaining security and supporting both npm and Yarn!** 