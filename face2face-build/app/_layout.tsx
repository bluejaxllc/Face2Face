/**
 * Root Layout
 * Wraps the app in providers (Auth, Query, Location).
 * Handles splash screen and auth-based routing.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, LogBox } from 'react-native';

// Suppress Expo Go SDK 53 Push Notification crash/warning on Android
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    // Make Android nav bar match app theme
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#0f172a');
      NavigationBar.setButtonStyleAsync('light');
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <StatusBar style="light" translucent />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0f172a' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
