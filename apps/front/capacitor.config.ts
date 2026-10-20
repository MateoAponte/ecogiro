import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecogiro.app',
  appName: 'ecogiro',
  webDir: 'dist',
  server: {
    // For development: uncomment to enable hot-reload from Lovable preview
    // url: 'https://1099b9a7-8ec7-42a1-b567-11154e5aae82.lovableproject.com?forceHideBadge=true',
    // cleartext: true,

    // For production: comment the above and use the built files
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#1E8E5A',
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
    SystemBars: {
      insetsHandling: 'native',
    },
    Camera: {
      presentationStyle: 'fullScreen',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFAF0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFAF0',
  },
  ios: {
    backgroundColor: '#FFFAF0',
  },
};

export default config;
