import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { colors, theme, spacing, borderRadius, touchTarget, shadows } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile } from '../../services/profileService';
import { Profile, ProfilePhoto } from '../../types';
import { ProfileStackParamList } from '../../navigation/ProfileStack';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const [profileData, setProfileData] = useState<Profile | null>(profile);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await getFullProfile(user.id);
    if (result.error) {
      setError(result.error);
      setProfileData(profile);
      setPhotos([]);
    } else {
      setError(null);
      setProfileData(result.data.profile || profile);
      setPhotos(result.data.photos);
    }
    setLoading(false);
  }, [profile, user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

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

  const leadPhoto = photos.find((photo) => photo.position === 0) || photos[0] || null;
  const additionalPhotos = useMemo(
    () => photos.filter((photo) => !leadPhoto || photo.id !== leadPhoto.id),
    [leadPhoto, photos]
  );

  const initials = profileData?.name
    ? profileData.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0)?.toUpperCase() || '?';

  const ageText = useMemo(() => {
    const birthday = profileData?.birthday;
    if (!birthday) return null;

    const birthDate = new Date(birthday);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age > 0 ? `${age}` : null;
  }, [profileData?.birthday]);

  const locationLine = [ageText, profileData?.neighborhood, profileData?.city]
    .filter(Boolean)
    .join(' · ');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.pencilIcon}>✏</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.leadPhotoContainer}>
        {leadPhoto ? (
          <Image source={{ uri: leadPhoto.photo_url }} style={styles.leadPhoto} contentFit="cover" />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        )}
        <View style={styles.nameOverlay}>
          <Text style={styles.nameOverlayText}>{profileData?.name || 'Anonymous'}</Text>
        </View>
      </View>

      {locationLine ? <Text style={styles.metaLine}>{locationLine}</Text> : null}

      {photos.length === 0 ? (
        <TouchableOpacity style={styles.migrationBanner} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.migrationTitle}>Add a photo so people know who they&apos;re meeting!</Text>
          <Text style={styles.migrationCta}>Tap to edit profile</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.infoCard}>
        {profileData?.work_type ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profileData.work_type}</Text>
          </View>
        ) : null}

        {profileData?.tagline ? <Text style={styles.tagline}>{profileData.tagline}</Text> : null}

        {profileData?.currently_working_on ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currently Working On</Text>
            <Text style={styles.infoValue}>{profileData.currently_working_on}</Text>
          </View>
        ) : null}

        {profileData?.work ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Work</Text>
            <Text style={styles.infoValue}>{profileData.work}</Text>
          </View>
        ) : null}

        {profileData?.school ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>{profileData.school}</Text>
          </View>
        ) : null}

        {!profileData?.work_type &&
        !profileData?.tagline &&
        !profileData?.currently_working_on &&
        !profileData?.work &&
        !profileData?.school ? (
          <Text style={styles.emptyInfoText}>Add profile details to help people get to know you.</Text>
        ) : null}
      </View>

      {additionalPhotos.map((photo) => (
        <Image
          key={photo.id}
          source={{ uri: photo.photo_url }}
          style={styles.additionalPhoto}
          contentFit="cover"
        />
      ))}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    minHeight: 56,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  headerSpacer: {
    minWidth: 44,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerAction: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
  },
  pencilIcon: {
    fontSize: 18,
    color: theme.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[12],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  leadPhotoContainer: {
    height: 400,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  leadPhoto: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  nameOverlay: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    bottom: spacing[4],
  },
  nameOverlayText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaLine: {
    marginTop: spacing[3],
    marginHorizontal: spacing[5],
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  migrationBanner: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    backgroundColor: colors.accentPrimaryLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing[4],
  },
  migrationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  migrationCta: {
    marginTop: spacing[1],
    fontSize: 13,
    color: theme.textSecondary,
  },
  infoCard: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing[4],
    ...shadows.card,
  },
  badge: {
    backgroundColor: colors.accentPrimaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[3],
  },
  badgeText: {
    fontSize: 12,
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 18,
    lineHeight: 24,
    fontStyle: 'italic',
    color: theme.text,
    marginBottom: spacing[4],
  },
  infoRow: {
    marginBottom: spacing[3],
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 22,
  },
  emptyInfoText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  additionalPhoto: {
    height: 360,
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
  },
  errorText: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    color: theme.error,
    fontSize: 13,
  },
  editButton: {
    marginTop: spacing[5],
    marginHorizontal: spacing[4],
    minHeight: touchTarget.min,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  signOutButton: {
    marginTop: spacing[6],
    marginBottom: spacing[4],
    minHeight: touchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: '500',
  },
});
