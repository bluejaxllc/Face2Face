/**
 * BumpInteraction — Tilt-based bump gesture with native sensors
 * Triggers when user tilts phone forward (top of phone dips down past horizontal).
 * Uses Magnetometer for compass heading toward target user.
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { triggerBumpHaptic, triggerSuccess, triggerLightTap } from '@/services/haptics';
import api from '@/services/api';
import { useLocation } from '@/contexts/LocationContext';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  latitude?: number;
  longitude?: number;
}

interface BumpInteractionProps {
  visible: boolean;
  user: User | null;
  distance: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Stage = 'initializing' | 'moving' | 'message' | 'complete';

export default function BumpInteraction({ visible, user, distance, onClose, onSuccess }: BumpInteractionProps) {
  const { currentLocation } = useLocation();
  const [stage, setStage] = useState<Stage>('initializing');
  const [message, setMessage] = useState('');
  const [isVibrating, setIsVibrating] = useState(false);
  const [sending, setSending] = useState(false);

  // Compass State
  const [heading, setHeading] = useState<number>(0);
  const [targetBearing, setTargetBearing] = useState<number | null>(null);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  
  // Ref for exact heading value inside closures
  const headingRef = useRef(0);
  const targetBearingRef = useRef<number | null>(null);

  const compassAnim = useRef(new Animated.Value(0)).current;
  const headingSubscription = useRef<Location.LocationSubscription | null>(null);
  const accelSubscription = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  
  // Tilt detection: track if the phone started upright
  const wasUprightRef = useRef(false);
  const bumpTriggeredRef = useRef(false);
  const [tiltY, setTiltY] = useState(-1); // For UI feedback

  // Initialize tilt sensor and compass on open
  useEffect(() => {
    if (visible && user) {
      setStage('initializing');
      setMessage('');
      wasUprightRef.current = false;
      bumpTriggeredRef.current = false;
      initTiltAndCompass();
    }

    return () => {
      if (accelSubscription.current) {
        accelSubscription.current.remove();
        accelSubscription.current = null;
      }
      if (headingSubscription.current) {
        headingSubscription.current.remove();
        headingSubscription.current = null;
      }
    };
  }, [visible, user]);

  const initTiltAndCompass = async () => {
    try {
      console.log('[Bump] Init — currentLocation:', currentLocation, 'user coords:', user?.latitude, user?.longitude);
      if (currentLocation && user?.latitude && user?.longitude) {
        const brng = calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          Number(user.latitude),
          Number(user.longitude)
        );
        console.log('[Bump] Computed bearing:', brng, '°');
        setTargetBearing(brng);
        targetBearingRef.current = brng;
      } else {
        console.warn('[Bump] No valid coordinates — skipping bearing.');
      }

      // Start compass heading watcher
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        headingSubscription.current = await Location.watchHeadingAsync((data) => {
          const newHeading = data.trueHeading !== -1 ? data.trueHeading : data.magHeading;
          setHeading(newHeading);
          headingRef.current = newHeading;
          
          if (targetBearingRef.current !== null) {
            let diff = Math.abs(newHeading - targetBearingRef.current);
            if (diff > 180) diff = 360 - diff;
            setIsAligned(diff < 35);
          } else {
            setIsAligned(true);
          }
        });
      }

      // Start raw accelerometer for tilt detection
      Accelerometer.setUpdateInterval(50); // 20fps is plenty for tilt
      accelSubscription.current = Accelerometer.addListener(({ y }) => {
        setTiltY(y);
        
        // Phase 1: User must first hold phone UPRIGHT (y < -0.5)
        if (y < -0.5) {
          wasUprightRef.current = true;
        }
        
        // Phase 2: Once upright, detect forward tilt (y crosses above -0.2 = top of phone at/below horizontal)
        if (wasUprightRef.current && !bumpTriggeredRef.current && y > -0.2) {
          console.log('[Bump] TILT TRIGGERED! y =', y);
          bumpTriggeredRef.current = true;
          
          // Check compass alignment
          let aligned = true;
          if (targetBearingRef.current !== null) {
            let diff = Math.abs(headingRef.current - targetBearingRef.current);
            if (diff > 180) diff = 360 - diff;
            aligned = diff < 35;
          }
          
          if (aligned) {
            Vibration.vibrate([0, 150, 150, 150]);
            triggerBumpHaptic();
            setIsVibrating(true);
            setTimeout(() => setIsVibrating(false), 500);
            
            // Cleanup sensors
            if (accelSubscription.current) {
              accelSubscription.current.remove();
              accelSubscription.current = null;
            }
            if (headingSubscription.current) {
              headingSubscription.current.remove();
              headingSubscription.current = null;
            }
            setStage('message');
          } else {
            // Not aligned — reset so they can try again
            console.log('[Bump] Tilted but not aimed at target. Resetting.');
            wasUprightRef.current = false;
            bumpTriggeredRef.current = false;
          }
        }
      });

      setStage('moving');
    } catch (error) {
      console.error('[Bump] Tilt init failed:', error);
      setStage('message');
    }
  };

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = Math.PI / 180;
    const toDeg = 180 / Math.PI;
    const dLon = (lon2 - lon1) * toRad;
    const y = Math.sin(dLon) * Math.cos(lat2 * toRad);
    const x = Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
              Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * toDeg;
    return (brng + 360) % 360;
  };

  const sendBump = async () => {
    if (!user) return;
    setSending(true);

    try {
      const res = await api.post('/api/bumps', {
        bumpedUserId: user.id,
        status: 'initiated',
        message: message.trim() || undefined,
      });

      triggerSuccess();
      setStage('complete');

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      Alert.alert('Bump Failed', error.message || 'Unable to send bump. Please try again.');
    } finally {
      setSending(false);
    }
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* ─── Initializing ─── */}
          {stage === 'initializing' && (
            <>
              <Text style={styles.title}>Preparing to Bump</Text>
              <Text style={styles.subtitle}>Initializing motion sensors...</Text>
              <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            </>
          )}

          {/* ─── Moving ─── */}
          {stage === 'moving' && (
            <>
              <Text style={styles.title}>Aim & Dip! 👊</Text>
              <Text style={styles.subtitle}>
                Point your phone toward {user?.firstName}, then dip the top forward to bump!
              </Text>

              {/* Tilt status indicator */}
              <Text style={{ color: wasUprightRef.current ? '#22c55e' : '#94a3b8', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
                {wasUprightRef.current ? '✓ Phone upright — now dip forward!' : 'Hold phone upright first...'}
              </Text>

              <View style={[styles.iconContainer, isVibrating && styles.vibrating]}>
                <View style={[styles.directionCircle, isAligned && { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                  <Animated.View style={{
                      transform: [{
                        rotate: (targetBearing !== null)
                          ? `${(targetBearing - heading + 360) % 360}deg`
                          : '0deg'
                      }]
                  }}>
                    <Ionicons
                      name="navigate"
                      size={56}
                      color={isAligned ? "#22c55e" : (targetBearing === null ? "#3b82f6" : "#64748b")}
                      style={{ transform: [{ translateY: -4 }] }}
                    />
                  </Animated.View>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─── Message ─── */}
          {stage === 'message' && (
            <>
              <Text style={styles.title}>Bump {user?.firstName}! ⚡</Text>
              <Text style={styles.subtitle}>Add a personal message to your bump</Text>

              <View style={styles.userPill}>
                <View style={styles.pillAvatar}>
                  <Text style={styles.pillAvatarText}>
                    {user?.firstName[0]}{user?.lastName[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.pillName}>{user?.firstName} {user?.lastName}</Text>
                  <Text style={styles.pillCategory}>
                    {user?.category ? user.category.charAt(0).toUpperCase() + user.category.slice(1) : 'Friendships'}
                  </Text>
                </View>
              </View>

              <TextInput
                style={styles.messageInput}
                placeholder="Hey, want to meet up?"
                placeholderTextColor="#475569"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={300}
                autoFocus
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                  onPress={sendBump}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={18} color="#fff" />
                      <Text style={styles.sendText}>Send Bump</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─── Complete ─── */}
          {stage === 'complete' && (
            <>
              <Text style={styles.title}>Bump Sent! ⚡</Text>
              <Text style={styles.subtitle}>
                {user?.firstName} will get a notification. You'll hear back soon!
              </Text>
              <View style={styles.iconContainer}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={40} color="#22c55e" />
                </View>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  vibrating: {
    // React Native doesn't have CSS animations, but the haptic gives the feedback
  },
  directionCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    width: 40,
    textAlign: 'right',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  pillAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillAvatarText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  pillName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  pillCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  messageInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    color: '#f1f5f9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    marginTop: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
