// Centralized environment configurations
// This file can be easily updated for different deployment scenarios
// 🫖 Hot water configuration - Our friendship continues!

export const ENVIRONMENTS = {
  development: {
    API_URL: 'http://localhost:3000',
    GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'your_dev_google_maps_api_key',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_dev_google_client_id',
    GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'your_dev_google_maps_map_id',
    USE_ADVANCED_MARKER: true,
    DEBUG_MODE: true
  },
  
  production: {
    API_URL: 'https://xhere-web.onrender.com', // Updated to correct Render.com backend URL
    GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'your_prod_google_maps_api_key',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_prod_google_client_id',
    GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'your_prod_google_maps_map_id',
    USE_ADVANCED_MARKER: true,
    DEBUG_MODE: false
  },
  
  staging: {
    API_URL: 'https://staging.xhere.world',
    GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'your_staging_google_maps_api_key',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_staging_google_client_id',
    GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'your_staging_google_maps_map_id',
    USE_ADVANCED_MARKER: true,
    DEBUG_MODE: true
  }
};

// Helper function to get current environment
export const getCurrentEnvironment = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // Check for explicit environment override
  if (process.env.REACT_APP_ENVIRONMENT) {
    return process.env.REACT_APP_ENVIRONMENT;
  }
  
  // Auto-detect based on hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  }
  
  // Check for Render.com domains
  if (hostname.includes('onrender.com')) {
    return 'production';
  }
  
  return 'production';
};

// Get configuration for current environment
export const getEnvironmentConfig = () => {
  const env = getCurrentEnvironment();
  console.log('🌍 Current environment:', env);
  console.log('🔗 API URL:', ENVIRONMENTS[env]?.API_URL);
  return ENVIRONMENTS[env] || ENVIRONMENTS.development;
};

// 🫖 Hot water environment setup complete! - Friendship preserved in code 