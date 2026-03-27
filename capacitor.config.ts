import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.bumpandgrind.app',
    appName: 'Bump & Grind',
    webDir: 'dist/public',
    server: {
        // For dev: point to your local Vite dev server IP
        // url: 'http://192.168.x.x:5000',
        // cleartext: true,
        androidScheme: 'https',
    },
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#1e293b',
            showSpinner: true,
            spinnerColor: '#ec4899',
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#1e293b',
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
    },
};

export default config;
