import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1099b9a78ec742a1b56711154e5aae82',
  appName: 'plastic-payoff',
  webDir: 'dist',
  server: {
    // For development: uncomment to enable hot-reload from Lovable preview
    // url: 'https://1099b9a7-8ec7-42a1-b567-11154e5aae82.lovableproject.com?forceHideBadge=true',
    // cleartext: true,
    
    // For production: comment the above and use the built files
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullScreen',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#22C55E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  ios: {
    backgroundColor: '#ffffff',
  },
};

export default config;
