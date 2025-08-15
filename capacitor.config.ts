import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.knoxdev.fluentflip',
  appName: 'FluentFlip',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#ffffff'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
