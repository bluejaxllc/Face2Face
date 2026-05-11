/**
 * Profile Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { triggerLightTap, triggerSuccess, triggerError } from '@/services/haptics';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [bio, setBio] = useState(user?.bio ?? '');
  const [bumpMessage, setBumpMessage] = useState(user?.bumpMessage ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ bio, bumpMessage });
      triggerSuccess();
      setIsEditing(false);
    } catch (error) {
      triggerError();
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            onPress={() => {
              triggerLightTap();
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
          >
            <Text style={styles.editButton}>
              {isEditing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { borderColor: user.gender === 'male' ? '#3b82f6' : '#ec4899' }]}>
            <Text style={styles.avatarText}>
              {user.firstName[0]}{user.lastName[0]}
            </Text>
          </View>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>
                {user.gender === 'male' ? '♂' : '♀'} {user.age}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>
                {user.category?.charAt(0).toUpperCase()}{user.category?.slice(1)}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>
                {'⭐'.repeat(Math.min(5, Math.round((user.selfRating ?? 5) / 2)))}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          {isEditing ? (
            <TextInput
              style={styles.textArea}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              placeholderTextColor="#475569"
              multiline
              maxLength={500}
            />
          ) : (
            <Text style={styles.sectionContent}>
              {user.bio || 'No bio yet — tap Edit to add one'}
            </Text>
          )}
        </View>

        {/* Bump Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Bump Message</Text>
          {isEditing ? (
            <TextInput
              style={styles.textArea}
              value={bumpMessage}
              onChangeText={setBumpMessage}
              placeholder="Hey! I just bumped you ✨"
              placeholderTextColor="#475569"
              multiline
              maxLength={200}
            />
          ) : (
            <Text style={styles.sectionContent}>
              {user.bumpMessage || 'Hey! I just bumped you ✨'}
            </Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{user.email}</Text>
          </View>
          {user.favoriteColor && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Favorite Color</Text>
              <Text style={styles.detailValue}>{user.favoriteColor}</Text>
            </View>
          )}
          {user.fieldOfStudy && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Field of Study</Text>
              <Text style={styles.detailValue}>{user.fieldOfStudy}</Text>
            </View>
          )}
          {user.interests && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interests</Text>
              <Text style={styles.detailValue}>{user.interests}</Text>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 16,
  },
  avatarText: {
    color: '#e2e8f0',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  username: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  metaBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.2)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  textArea: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
