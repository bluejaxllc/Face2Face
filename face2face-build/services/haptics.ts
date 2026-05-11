/**
 * Haptics Service — Expo Native
 * Uses expo-haptics combined with React Native's Vibration API 
 * for reliable and forceful cross-platform feedback that doesn't get swallowed by OS power modes.
 */

import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';

export async function triggerLightTap(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(20);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {}
}

export async function triggerMediumTap(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(40);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {}
}

export async function triggerHeavyTap(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(80);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (e) {}
}

export async function triggerHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(50);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {}
}

export async function triggerBumpHaptic(): Promise<void> {
  try {
    // Sustained heavy bump
    if (Platform.OS === 'android') {
      Vibration.vibrate(2000); // Guaranteed 2-second rumble on Android
    } else {
      // iOS ignores durations, so we mix a standard system vibrate with a haptic loop
      Vibration.vibrate(); 
      for (let i = 0; i < 8; i++) {
        setTimeout(async () => {
          try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
        }, i * 250);
      }
    }
  } catch (e) {}
}

export async function triggerHeartbeatHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 100, 100, 300, 500, 100, 100, 300]);
    } else {
      // Standard system vibrate on iOS alongside haptics ensures we feel something
      Vibration.vibrate(); 
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
      }, 80);
      setTimeout(async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch(e){}
      }, 480);
      setTimeout(async () => {
        try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
      }, 560);
    }
  } catch (e) {}
}

export async function triggerSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {}
}

export async function triggerError(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 200, 100, 200]);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch (e) {}
}

export async function triggerWarning(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {}
}

export async function triggerSelectionChanged(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(15);
    } else {
      await Haptics.selectionAsync();
    }
  } catch (e) {}
}
