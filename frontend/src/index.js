import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppMobile from './AppMobile';
import reportWebVitals from './reportWebVitals';

// Enhanced platform detection
const detectPlatform = () => {
  const isCapacitor = !!(window.Capacitor);
  const isNative = isCapacitor && !!(window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  // Prioritize native environment
  if (isNative) {
    console.log('🔍 Platform Detection: Running in native Capacitor environment.');
    return 'mobile-native';
  }

  // Check for mobile user agent
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileDevice) {
    console.log('🔍 Platform Detection: Mobile user agent detected.');
    return 'mobile-web';
  }

  // Default to web for desktop browsers
  console.log('🔍 Platform Detection: Desktop browser detected.');
  return 'web';
};

// Determine which app version to render
const getAppComponent = () => {
  // Check for force web/mobile parameter (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('forceWeb') === 'true') {
    console.log('🖥️ Force web mode enabled via URL parameter');
    return App;
  }
  if (urlParams.get('forceMobile') === 'true') {
    console.log('📱 Force mobile mode enabled via URL parameter');
    return AppMobile;
  }
  
  const platform = detectPlatform();
  
  // Use mobile version for all mobile platforms
  if (platform.startsWith('mobile')) {
    console.log('📱 Rendering mobile app version');
    return AppMobile;
  }
  
  // Use web version for desktop
  console.log('🖥️ Rendering web app version');
  return App;
};

const AppComponent = getAppComponent();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
