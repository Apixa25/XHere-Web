// Debug script to check environment variables
console.log('🔍 Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_GOOGLE_MAPS_API_KEY:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
console.log('REACT_APP_GOOGLE_MAPS_MAP_ID:', process.env.REACT_APP_GOOGLE_MAPS_MAP_ID ? 'Present' : 'Missing');
console.log('REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);

// Test the environment detection
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
console.log('Hostname:', hostname);

// Check if we're in Capacitor
const isCapacitor = typeof window !== 'undefined' && window.Capacitor;
console.log('Is Capacitor:', isCapacitor);

// Test environment detection logic
let detectedEnv = 'development';
if (process.env.REACT_APP_ENVIRONMENT) {
  detectedEnv = process.env.REACT_APP_ENVIRONMENT;
} else if (isCapacitor) {
  detectedEnv = 'development';
} else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
  detectedEnv = 'development';
} else if (hostname.includes('staging') || hostname.includes('test')) {
  detectedEnv = 'staging';
} else {
  detectedEnv = 'production';
}

console.log('Detected Environment:', detectedEnv); 