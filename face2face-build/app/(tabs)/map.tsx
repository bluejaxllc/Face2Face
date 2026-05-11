/**
 * Map Screen — Native MapView
 * Uses react-native-maps instead of Leaflet.
 * This is the main screen users see after login.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { triggerLightTap, triggerSelectionChanged } from '@/services/haptics';
import ProfileCard from '@/components/ProfileCard';
import BumpInteraction from '@/components/BumpInteraction';

interface NearbyUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  category: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  gender: string;
  age: number;
  selfRating: number;
  height?: string | null;
  weight?: string | null;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  bumpMessage?: string | null;
  profilePhoto?: string | null;
}

export default function MapScreen() {
  const { currentLocation, isError, updateLocation } = useLocation();
  const { user, updateProfile } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [showBumpModal, setShowBumpModal] = useState(false);
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [showMen, setShowMen] = useState(true);
  const [showWomen, setShowWomen] = useState(true);
  const [radius, setRadius] = useState(25000);
  const [mapReady, setMapReady] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch nearby users
  const fetchNearbyUsers = useCallback(async () => {
    if (!isActive) return;
    setIsLoadingUsers(true);
    try {
      const users = await api.get<NearbyUser[]>(`/api/users/nearby`);
      setNearbyUsers(users);
    } catch (error) {
      console.warn('[Map] Failed to fetch nearby users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isActive, radius]);

  useEffect(() => {
    fetchNearbyUsers();
    const interval = setInterval(fetchNearbyUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchNearbyUsers]);

  // Filter users by gender
  const filteredUsers = nearbyUsers.filter(u => {
    const g = (u.gender || '').toLowerCase();
    if (g === 'male') return showMen;
    if (g === 'female') return showWomen;
    // For any other gender value, show only if both filters are on
    return showMen && showWomen;
  });

  // Toggle active status
  const handleStatusToggle = async () => {
    const newStatus = !isActive;
    triggerLightTap();
    setIsActive(newStatus);
    try {
      await updateProfile({ isActive: newStatus });
    } catch (error) {
      setIsActive(!newStatus);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Center on current location
  const handleCenterOnMe = () => {
    triggerLightTap();
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  // Handle marker press
  const handleMarkerPress = (user: NearbyUser) => {
    triggerSelectionChanged();
    setSelectedUser(user);
  };

  // Handle bump from profile card
  const handleBump = (user: NearbyUser) => {
    setSelectedUser(user);
    setShowBumpModal(true);
  };

  const defaultRegion: Region = {
    latitude: currentLocation?.latitude ?? 32.8728576,
    longitude: currentLocation?.longitude ?? -96.5312512,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Native Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        userInterfaceStyle="dark"
        onMapReady={() => setMapReady(true)}
      >

        {/* Radius circle */}
        {currentLocation && radius < 25000 && (
          <Circle
            center={currentLocation}
            radius={radius * 1609.34}
            strokeColor="rgba(66, 133, 244, 0.4)"
            fillColor="rgba(66, 133, 244, 0.08)"
            strokeWidth={2}
          />
        )}

        {/* Nearby user markers */}
        {isActive && filteredUsers.map(u => (
          <Marker
            key={u.id}
            coordinate={{
              latitude: Number(u.latitude),
              longitude: Number(u.longitude),
            }}
            onPress={() => handleMarkerPress(u)}
            pinColor={u.gender === 'male' ? '#3b82f6' : '#ec4899'}
            title={`${u.firstName}, ${u.age}`}
            description={currentLocation
              ? `${formatDistance(calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  Number(u.latitude),
                  Number(u.longitude)
                ))} away`
              : undefined
            }
          />
        ))}
      </MapView>

      {/* ═══ TOP LEFT: User count ═══ */}
      <SafeAreaView style={styles.topLeftOverlay} edges={['top']}>
        <View style={styles.userCountPill}>
          <View style={[styles.statusDot, mapReady ? styles.statusDotActive : styles.statusDotLoading]} />
          {/* Add 1 to include the current user if they are online */}
          <Text style={styles.userCountText}>{filteredUsers.length + (isActive ? 1 : 0)}</Text>
          <Ionicons name="people" size={12} color="#64748b" />
        </View>
      </SafeAreaView>

      {/* ═══ DEBUG MENU (DEV ONLY) ═══ */}
      {__DEV__ && (
        <SafeAreaView style={{ position: 'absolute', top: 60, right: 12, alignItems: 'flex-end', gap: 8 }} edges={['top']}>
          <TouchableOpacity 
            style={[styles.liveToggle, { backgroundColor: '#fef08a', borderColor: '#eab308' }]} 
            onPress={() => {
              import('@/services/haptics').then(h => h.triggerSelectionChanged());
              handleBump({
                id: 9999,
                username: 'DebugUser',
                firstName: 'Test',
                lastName: 'Bumper',
                category: 'test',
                isActive: true,
                latitude: (currentLocation?.latitude || 32.8728576) + 0.008,
                longitude: (currentLocation?.longitude || -96.5312512) + 0.008,
                gender: 'male',
                age: 25,
                selfRating: 8
              });
            }}
          >
            <Ionicons name="bug" size={14} color="#a16207" />
            <Text style={[styles.liveText, { color: '#a16207' }]}>TEST BUMP</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.liveToggle, { backgroundColor: '#cffafe', borderColor: '#06b6d4' }]} 
            onPress={() => {
              import('@/services/haptics').then(h => {
                h.triggerSuccess();
                setTimeout(() => h.triggerError(), 1000);
                setTimeout(() => h.triggerLightTap(), 2000);
              });
            }}
          >
            <Ionicons name="hardware-chip" size={14} color="#0891b2" />
            <Text style={[styles.liveText, { color: '#0891b2' }]}>TEST HAPTICS</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* ═══ TOP RIGHT: Go Live toggle ═══ */}
      <SafeAreaView style={styles.topRightOverlay} edges={['top']}>
        <TouchableOpacity
          style={[styles.liveToggle, isActive && styles.liveToggleActive]}
          onPress={handleStatusToggle}
          activeOpacity={0.8}
        >
          <Ionicons
            name="radio"
            size={14}
            color={isActive ? '#22c55e' : '#6b7280'}
          />
          <Text style={[styles.liveText, isActive && styles.liveTextActive]}>
            {isActive ? 'LIVE' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ═══ BOTTOM CENTER: Gender toggle ═══ */}
      <View style={styles.bottomCenterOverlay}>
        <View style={styles.genderToggleContainer}>
          <TouchableOpacity
            style={[styles.genderButton, showMen && styles.genderButtonMaleActive]}
            onPress={() => {
              triggerLightTap();
              // Block turning off only if it's the last active filter
              if (showMen && !showWomen) return;
              setShowMen(!showMen);
            }}
          >
            <Text style={[styles.genderIcon, showMen && styles.genderIconActive]}>♂</Text>
          </TouchableOpacity>
          <View style={styles.genderDivider} />
          <TouchableOpacity
            style={[styles.genderButton, showWomen && styles.genderButtonFemaleActive]}
            onPress={() => {
              triggerLightTap();
              // Block turning off only if it's the last active filter
              if (showWomen && !showMen) return;
              setShowWomen(!showWomen);
            }}
          >
            <Text style={[styles.genderIcon, showWomen && styles.genderIconActive]}>♀</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ BOTTOM RIGHT: Map controls ═══ */}
      <View style={styles.bottomRightOverlay}>
        <TouchableOpacity style={styles.mapButton} onPress={handleCenterOnMe}>
          <Ionicons name="locate" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* ═══ Profile Card Overlay ═══ */}
      {selectedUser && !showBumpModal && (
        <ProfileCard
          user={selectedUser}
          currentLocation={currentLocation}
          onClose={() => setSelectedUser(null)}
          onBump={() => handleBump(selectedUser)}
        />
      )}

      {/* ═══ Bump Interaction Modal ═══ */}
      <BumpInteraction
        visible={showBumpModal}
        user={selectedUser}
        distance={
          selectedUser && currentLocation
            ? calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                Number(selectedUser.latitude),
                Number(selectedUser.longitude)
              )
            : null
        }
        onClose={() => {
          setShowBumpModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setShowBumpModal(false);
          setSelectedUser(null);
          fetchNearbyUsers();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Left
  topLeftOverlay: {
    position: 'absolute',
    top: 0,
    left: 12,
  },
  userCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: '#22c55e',
  },
  statusDotLoading: {
    backgroundColor: '#f59e0b',
  },
  userCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  // Top Right
  topRightOverlay: {
    position: 'absolute',
    top: 0,
    right: 12,
  },
  liveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  liveToggleActive: {
    backgroundColor: 'rgba(240, 253, 244, 0.95)',
    borderColor: 'rgba(134, 239, 172, 0.5)',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6b7280',
  },
  liveTextActive: {
    color: '#16a34a',
  },

  // Bottom Center
  bottomCenterOverlay: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  genderToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  genderButton: {
    width: 40,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonMaleActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  genderButtonFemaleActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  genderDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 1,
  },
  genderIcon: {
    fontSize: 18,
    color: '#94a3b8',
  },
  genderIconActive: {
    color: '#1e293b',
  },

  // Bottom Right
  bottomRightOverlay: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    gap: 8,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.3)',
  },
});
