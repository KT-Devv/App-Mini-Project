
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a1fbf04d48b145bba071fc1e5bee78df',
  appName: 'StudySphere',
  webDir: 'dist',
  server: {
    url: 'https://a1fbf04d-48b1-45bb-a071-fc1e5bee78df.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3B82F6',
      showSpinner: false
    }
  }
};

export default config;
