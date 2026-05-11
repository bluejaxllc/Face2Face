/**
 * Explore Screen — Browse nearby users in a card/list view
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useLocation } from '@/contexts/LocationContext';
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
  latitude: number;
  longitude: number;
  profilePhoto?: string | null;
}

export default function ExploreScreen() {
  const { currentLocation } = useLocation();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.get<NearbyUser[]>('/api/users/nearby');
      setUsers(data);
    } catch (error) {
      console.warn('[Explore] Failed to fetch:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const getDistance = (user: NearbyUser): string | null => {
    if (!currentLocation) return null;
    return formatDistance(
      calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        Number(user.latitude),
        Number(user.longitude)
      )
    );
  };

  const renderUser = ({ item }: { item: NearbyUser }) => {
    const distance = getDistance(item);
    const categoryColors: Record<string, string> = {
      dating: '#ec4899',
      business: '#3b82f6',
      friendships: '#22c55e',
    };
    const categoryColor = categoryColors[item.category] || '#64748b';

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() => triggerLightTap()}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { borderColor: item.gender === 'male' ? '#3b82f6' : '#ec4899' }]}>
          <Text style={styles.avatarText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.firstName}, {item.age}</Text>
            <Text style={styles.genderSymbol}>
              {item.gender === 'male' ? '♂' : '♀'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </View>
            <Text style={styles.ratingText}>
              {'⭐'.repeat(Math.min(5, Math.round(item.selfRating / 2)))}
            </Text>
          </View>
        </View>

        {/* Distance */}
        {distance && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location-outline" size={12} color="#818cf8" />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>{users.length} people nearby</Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="compass-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No one nearby yet</Text>
            <Text style={styles.emptySubtext}>Pull to refresh or expand your radius</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 14,
  },
  avatarText: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  genderSymbol: {
    fontSize: 16,
    color: '#94a3b8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 11,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#334155',
  },
});
