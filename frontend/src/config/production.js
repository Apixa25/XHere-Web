// Production Configuration for deployed application
export const PRODUCTION_CONFIG = {
  API_URL: 'https://api.xhere.world',
  GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  GOOGLE_MAPS_MAP_ID: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID,
  USE_ADVANCED_MARKER: true
}; 