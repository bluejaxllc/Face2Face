/**
 * ProfileCard — Shows user details when a marker is tapped on the map.
 * Slides up from the bottom as a card overlay.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { triggerLightTap } from '@/services/haptics';

interface NearbyUser {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  gender: string;
  age: number;
  selfRating: number;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  profilePhoto?: string | null;
  latitude: number;
  longitude: number;
}

interface ProfileCardProps {
  user: NearbyUser;
  currentLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onBump: () => void;
}

export default function ProfileCard({ user, currentLocation, onClose, onBump }: ProfileCardProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const distance = currentLocation
    ? formatDistance(calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        Number(user.latitude), Number(user.longitude)
      ))
    : null;

  const categoryColors: Record<string, string> = {
    dating: '#ec4899',
    business: '#3b82f6',
    friendships: '#22c55e',
  };
  const catColor = categoryColors[user.category] || '#64748b';

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      {/* Handle bar */}
      <View style={styles.handleBar} />

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* User info */}
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { borderColor: user.gender === 'male' ? '#3b82f6' : '#ec4899' }]}>
          <Text style={styles.avatarText}>
            {user.firstName[0]}{user.lastName[0]}
          </Text>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user.firstName}, {user.age}</Text>
            <Text style={[styles.genderSymbol, { color: user.gender === 'male' ? '#3b82f6' : '#ec4899' }]}>
              {user.gender === 'male' ? '♂' : '♀'}
            </Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: `${catColor}15` }]}>
              <Text style={[styles.badgeText, { color: catColor }]}>
                {user.category.charAt(0).toUpperCase() + user.category.slice(1)}
              </Text>
            </View>
            {distance && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location-outline" size={11} color="#818cf8" />
                <Text style={styles.distanceText}>{distance}</Text>
              </View>
            )}
          </View>

          <Text style={styles.ratingText}>
            {'⭐'.repeat(Math.min(5, Math.round(user.selfRating / 2)))}
          </Text>
        </View>
      </View>

      {/* Extra details */}
      {(user.interests || user.fieldOfStudy || user.favoriteColor) && (
        <View style={styles.detailsSection}>
          {user.fieldOfStudy && (
            <View style={styles.detailChip}>
              <Ionicons name="school-outline" size={14} color="#94a3b8" />
              <Text style={styles.detailText}>{user.fieldOfStudy}</Text>
            </View>
          )}
          {user.interests && (
            <View style={styles.detailChip}>
              <Ionicons name="heart-outline" size={14} color="#94a3b8" />
              <Text style={styles.detailText}>{user.interests}</Text>
            </View>
          )}
          {user.favoriteColor && (
            <View style={styles.detailChip}>
              <Ionicons name="color-palette-outline" size={14} color="#94a3b8" />
              <Text style={styles.detailText}>{user.favoriteColor}</Text>
            </View>
          )}
        </View>
      )}

      {/* Bump button */}
      <TouchableOpacity
        style={styles.bumpButton}
        onPress={() => {
          triggerLightTap();
          onBump();
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="flash" size={20} color="#fff" />
        <Text style={styles.bumpButtonText}>Bump {user.firstName}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  genderSymbol: {
    fontSize: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
  },
  ratingText: {
    fontSize: 12,
    marginTop: 4,
  },
  detailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  detailText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  bumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    marginTop: 20,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bumpButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
