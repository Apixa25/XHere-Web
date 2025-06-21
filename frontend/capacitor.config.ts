import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xhere.app',
  appName: 'XHere',
  /* React builds into the `build` folder, point Capacitor there so the
   * native wrapper serves the correct assets. */
  webDir: 'build',

  /* Server configuration used while running `npx cap run android -l --host`
   * or the Capacitor Dev App.  Update `url` so it points at your dev
   * machine – `10.0.2.2` works for Android emulators talking to
   * localhost on the host computer. */
  server: {
    url: 'http://10.0.2.2:3000',
    cleartext: true
  },

  /* Android-specific native configuration. */
  android: {
    /* Permissions required by the application.  Capacitor will merge these
     * into AndroidManifest.xml when the platform is added / updated. */
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ]
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
