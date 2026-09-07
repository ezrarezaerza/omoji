import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omoji.stickers',
  appName: 'Omoji',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      '*.vercel.app',
      '*.vercel-storage.com',
      'api.dicebear.com',
      '*.run.app',
      'localhost',
    ],
  },
  plugins: {
    WhatsAppStickers: {
      providerAuthority: 'com.omoji.stickers.provider',
    },
  },
};

export default config;
