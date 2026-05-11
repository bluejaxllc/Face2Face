/**
 * Push Notification Service
 * Registers for Expo push tokens, sends them to the backend,
 * and handles incoming notifications (foreground vibration + alerts).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert, Vibration } from 'react-native';
import api from './api';
import { triggerBumpHaptic } from './haptics';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and send token to backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return null;
  }

  try {
    // Get Expo push token - requires a projectId in newer SDKs
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
    if (!projectId) {
      console.warn('[Notifications] No EAS projectId configured. Bypassing push token check for local dev.');
      return 'ExponentPushToken[local-dev-mock-token]';
    }

    // Bypass Android in Expo Go since SDK 53 removed Android push support entirely
    if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
      console.warn('[Notifications] Running Android in Expo Go. Bypassing real push token generation.');
      return 'ExponentPushToken[expo-go-mock-token]';
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;
    console.log('[Notifications] Push token:', token);

    // Send token to backend
    await api.post('/api/users/push-token', { token });
    console.log('[Notifications] Token registered with backend');

    return token;
  } catch (error) {
    console.error('[Notifications] Registration failed:', error);
    return null;
  }
}

/**
 * Set up Android notification channel (required for Android 8+)
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bumps', {
      name: 'Bumps',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      sound: 'default',
      enableVibrate: true,
    });
    console.log('[Notifications] Android channel configured');
  }
}

/**
 * Handle foreground notification — vibrate the device
 */
export function setupForegroundHandler(): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    console.log('[Notifications] Received in foreground:', notification.request.content.title);

    // Vibrate differently based on notification type
    if (data?.type === 'bump') {
      // Heartbeat pattern: bump-bump
      Vibration.vibrate([0, 150, 150, 150]);
      triggerBumpHaptic();
    } else if (data?.type === 'bump_response' && data?.action === 'bump_back') {
      // Strong continuous vibration for accepted bump
      Vibration.vibrate([0, 400, 200, 400]);
      triggerBumpHaptic();
    }
  });
}

/**
 * Handle notification tap — returns cleanup function
 */
export function setupResponseHandler(
  onBumpTapped?: () => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('[Notifications] Tapped:', data);

    if (data?.screen === 'messages' && onBumpTapped) {
      onBumpTapped();
    }
  });
}
