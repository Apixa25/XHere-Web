// Configuration Template for AI Assistants
// This file shows the structure of environment variables and configuration
// Copy this structure to your actual .env files

export const CONFIG_TEMPLATE = {
  // API Configuration
  API_URL: {
    development: 'http://localhost:3000',
    staging: 'https://staging-api.xhere.world',
    production: 'https://api.xhere.world',
    description: 'Backend API endpoint for each environment'
  },
  
  // Google Services Configuration
  GOOGLE_MAPS_API_KEY: {
    development: 'your_dev_google_maps_api_key',
    staging: 'your_staging_google_maps_api_key', 
    production: 'your_prod_google_maps_api_key',
    description: 'Google Maps API key for each environment'
  },
  
  GOOGLE_CLIENT_ID: {
    development: 'your_dev_google_client_id',
    staging: 'your_staging_google_client_id',
    production: 'your_prod_google_client_id', 
    description: 'Google OAuth client ID for each environment'
  },
  
  GOOGLE_MAPS_MAP_ID: {
    development: 'your_dev_google_maps_map_id',
    staging: 'your_staging_google_maps_map_id',
    production: 'your_prod_google_maps_map_id',
    description: 'Google Maps Map ID for each environment'
  },
  
  // Feature Flags
  USE_ADVANCED_MARKER: {
    development: true,
    staging: true,
    production: true,
    description: 'Enable Google Maps Advanced Markers'
  },
  
  DEBUG_MODE: {
    development: true,
    staging: true,
    production: false,
    description: 'Enable debug logging and features'
  },
  
  // Development Settings
  LOG_LEVEL: {
    development: 'debug',
    staging: 'info',
    production: 'error',
    description: 'Logging level for each environment'
  },
  
  ENABLE_HOT_RELOAD: {
    development: true,
    staging: false,
    production: false,
    description: 'Enable hot reloading for development'
  }
};

// Environment Variable Mapping
export const ENV_VAR_MAPPING = {
  'REACT_APP_API_URL': 'API_URL',
  'REACT_APP_GOOGLE_MAPS_API_KEY': 'GOOGLE_MAPS_API_KEY',
  'REACT_APP_GOOGLE_CLIENT_ID': 'GOOGLE_CLIENT_ID', 
  'REACT_APP_GOOGLE_MAPS_MAP_ID': 'GOOGLE_MAPS_MAP_ID',
  'REACT_APP_DEBUG_MODE': 'DEBUG_MODE',
  'REACT_APP_LOG_LEVEL': 'LOG_LEVEL',
  'REACT_APP_ENABLE_HOT_RELOAD': 'ENABLE_HOT_RELOAD'
};

// Setup Instructions for AI Assistants
export const AI_SETUP_INSTRUCTIONS = `
🎯 AI Assistant Setup Instructions:

1. ENVIRONMENT VARIABLES:
   - Create .env.local files based on this template
   - Use REACT_APP_ prefix for all frontend variables
   - Keep sensitive keys out of version control

2. CONFIGURATION UPDATES:
   - Update src/config/environments.js with new settings
   - Update src/config/index.js to use new configs
   - Test in development before production

3. SECURITY NOTES:
   - Never commit actual API keys
   - Use different keys for dev/staging/prod
   - Rotate keys regularly

4. DEPLOYMENT:
   - Set environment variables in hosting platform
   - Use npm run build:prod for production builds
   - Test production builds locally first
`; 