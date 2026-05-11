/**
 * Tabs Layout — Bottom Navigation
 * Map, Explore, Messages, Profile tabs
 * Properly accounts for Android navigation buttons and iOS home indicator
 */

import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { triggerSelectionChanged } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  registerForPushNotifications,
  setupNotificationChannel,
  setupForegroundHandler,
  setupResponseHandler,
} from '@/services/notifications';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    // Redirect safely on next tick if session expires
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Initialize push notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let foregroundSub: any;
    let responseSub: any;

    const initPush = async () => {
      await setupNotificationChannel();
      await registerForPushNotifications();

      foregroundSub = setupForegroundHandler();
      responseSub = setupResponseHandler(() => {
        // Navigate to messages tab when bump notification is tapped
        router.push('/(tabs)/messages');
      });
    };

    initPush();

    return () => {
      foregroundSub?.remove();
      responseSub?.remove();
    };
  }, [isAuthenticated]);

  // Dynamic bottom padding: accounts for Android nav buttons AND iOS home indicator
  const tabBarHeight = 56 + insets.bottom;

  return (
    <LocationProvider enabled={isAuthenticated}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: 'rgba(51, 65, 85, 0.3)',
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#475569',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
        screenListeners={{
          tabPress: () => {
            triggerSelectionChanged();
          },
        }}
      >
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </LocationProvider>
  );
}
