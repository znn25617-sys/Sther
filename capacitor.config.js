// capacitor.config.js
// Mobile app shell configuration (Android / iOS). Sync with:
//   npm run build && npx cap add android && npx cap add ios && npx cap sync
// The built `dist/` folder is served as a WebView app shell.
export default {
  appId: 'com.aetheria.ascent',
  appName: "Aetheria's Ascent",
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0d0820'
  },
  ios: {
    backgroundColor: '#0d0820'
  }
};
