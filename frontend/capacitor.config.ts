import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xhere.app',
  appName: 'XHere',
  /* React builds into the `build` folder, point Capacitor there so the
   * native wrapper serves the correct assets. */
  webDir: 'build',
  server: {
    hostname: 'localhost',
    androidScheme: 'http'
  },

  /* Android-specific native configuration. */
  android: {
    // Permissions should be managed in AndroidManifest.xml
  },

  /* Plugin-level configuration */
  plugins: {
    Geolocation: {
      /* Allow background location updates if needed for the app’s
       * visit/collection mechanics. */
      backgroundLocation: true
    },
    Camera: {
      /* Don’t automatically save to gallery to keep user media private
       * until explicitly uploaded. */
      saveToGallery: false
    },
    Filesystem: {
      /* Use the documents directory for saved files. */
      directory: 'DOCUMENTS'
    }
  }
};

export default config;
