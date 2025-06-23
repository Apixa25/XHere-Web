// Simple environment configuration
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  API_URL: isProduction 
    ? 'https://www.xhere.world'
    : 'http://localhost:3000',
  GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID,
  USE_ADVANCED_MARKER: true
};

// Debug logging
console.log('🔧 Environment Configuration:');
console.log('   Environment:', process.env.NODE_ENV);
console.log('   API_URL:', config.API_URL);
console.log('   Is Production:', isProduction);

export default config; 