// Centralized environment configurations
// This file can be easily updated for different deployment scenarios
// 🫖 Hot water configuration - Our friendship continues!

// TODO: Replace this with your actual laptop's local IP address
const LOCAL_LAPTOP_IP = '192.168.1.198'; // <--- Updated to your laptop's IP!

export const ENVIRONMENTS = {
  development: {
    API_URL: (() => {
      // Check if we're running in Capacitor (mobile)
      if (typeof window !== 'undefined' && window.Capacitor) {
        if (window.Capacitor.getPlatform() === 'android') {
          // Use 10.0.2.2 for emulator, use local IP for real device
          // Simple heuristic: if running on localhost, use emulator; otherwise, use local IP
          // You can improve this logic as needed
          const isEmulator = navigator.userAgent.includes('Android SDK built for');
          if (isEmulator) {
            return 'http://10.0.2.2:3000';
          } else {
            return `http://${LOCAL_LAPTOP_IP}:3000`;
          }
        }
        // For iOS simulator
        if (window.Capacitor.getPlatform() === 'ios') {
          return 'http://localhost:3000';
        }
      }
      // For web development
      return 'http://localhost:3000';
    })(),
    GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'your_dev_google_maps_api_key',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_dev_google_client_id',
    GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'your_dev_google_maps_map_id',
    USE_ADVANCED_MARKER: true,
    DEBUG_MODE: true
  },
  
  production: {
    API_URL: 'https://api.xhere.world',
    GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'your_prod_google_maps_api_key',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your_prod_google_client_id',
    GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'your_prod_google_maps_map_id',
    USE_ADVANCED_MARKER: true,
    DEBUG_MODE: false
  },
  
  staging: {
    API_URL: 'https://staging-api.xhere.world',
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
  
  // Check if we're running in Capacitor (mobile)
  if (typeof window !== 'undefined' && window.Capacitor) {
    return 'development';
  }
  
  // Auto-detect based on hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  }
  
  return 'production';
};

// Get configuration for current environment
export const getEnvironmentConfig = () => {
  const env = getCurrentEnvironment();
  return ENVIRONMENTS[env] || ENVIRONMENTS.development;
};

// 🫖 Hot water environment setup complete! - Friendship preserved in code 