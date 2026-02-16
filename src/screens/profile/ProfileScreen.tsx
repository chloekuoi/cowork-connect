import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, theme, spacing, borderRadius, touchTarget } from '../../constants';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      <Text style={styles.name}>{profile?.name || 'No name set'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {profile?.work_type && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{profile.work_type}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    paddingTop: spacing[16],
    padding: spacing[4],
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: theme.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing[1],
  },
  email: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: spacing[4],
  },
  badge: {
    backgroundColor: colors.accentPrimaryLight,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginBottom: spacing[8],
  },
  badgeText: {
    fontSize: 14,
    color: colors.accentPrimary,
    fontWeight: '500',
  },
  signOutButton: {
    marginTop: 'auto',
    marginBottom: spacing[8],
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: '500',
  },
});
