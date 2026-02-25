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
import { colors, theme, spacing, borderRadius, touchTarget } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile } from '../../services/profileService';
import { getTodayIntent } from '../../services/discoveryService';
import { Profile, ProfilePhoto, WorkIntent } from '../../types';
import { ProfileStackParamList } from '../../navigation/ProfileStack';

const PHOTO_PROMPTS = [
  "Hi, I'm a real person 👋",
  'Proof I touch grass sometimes',
  'What my camera roll actually looks like',
  'Currently building something...',
];

const WORK_STYLE_EMOJI: Record<string, string> = {
  'Deep focus': '🎧',
  'Chat mode': '💬',
  'Flexible': '✌️',
};

const LOCATION_EMOJI: Record<string, string> = {
  'Cafe': '☕️',
  'Library': '📚',
  'Anywhere': '📍',
};

function formatBirthdayDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDisplayTime(value: string): string {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const [profileData, setProfileData] = useState<Profile | null>(profile);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayIntent, setTodayIntent] = useState<WorkIntent | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [result, intent] = await Promise.all([
      getFullProfile(user.id),
      getTodayIntent(user.id),
    ]);
    if (result.error) {
      setError(result.error);
      setProfileData(profile);
      setPhotos([]);
    } else {
      setError(null);
      setProfileData(result.data.profile || profile);
      setPhotos(result.data.photos);
    }
    setTodayIntent(intent);
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

  const filledPhotos = useMemo(
    () => [...photos].sort((a, b) => a.position - b.position),
    [photos]
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

  const aboutYouRows = [
    { label: 'Name', value: profileData?.name },
    { label: 'Username', value: profileData?.username ? `@${profileData.username}` : null },
    { label: 'Tagline', value: profileData?.tagline },
    { label: 'Currently working on', value: profileData?.currently_working_on },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const workSchoolRows = [
    { label: 'Work', value: profileData?.work },
    { label: 'School', value: profileData?.school },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const locationRows = [
    { label: 'Neighbourhood', value: profileData?.neighborhood },
    { label: 'City', value: profileData?.city },
    {
      label: 'Birthday',
      value: profileData?.birthday ? formatBirthdayDisplay(profileData.birthday) : null,
    },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const workTypeRows = [
    { label: 'Work type', value: profileData?.work_type },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const renderGroup = (rows: { label: string; value: string }[]) => {
    if (rows.length === 0) return null;
    return rows.map((row, index) => (
      <React.Fragment key={row.label}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{row.label}</Text>
          <Text style={styles.fieldValue}>{row.value}</Text>
        </View>
        {index < rows.length - 1 ? <View style={styles.rowSep} /> : null}
      </React.Fragment>
    ));
  };

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
        {/* ── Photo stack ── */}
        <View style={styles.photoStack}>
          {filledPhotos.length === 0 ? (
            <View style={[styles.photoFrame, styles.primaryFrame, styles.initialsFrame]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          ) : (
            filledPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoBlock}>
                <View style={[styles.photoFrame, photo.position === 0 ? styles.primaryFrame : styles.secondaryFrame]}>
                  <Image source={{ uri: photo.photo_url }} style={styles.photoImage} contentFit="cover" />
                </View>
                {PHOTO_PROMPTS[photo.position] ? (
                  <Text style={styles.promptLabel}>{PHOTO_PROMPTS[photo.position]}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* ── Name + meta ── */}
        <View style={styles.nameBlock}>
          <Text style={styles.nameText}>{profileData?.name || 'Your Name'}</Text>
          <View style={styles.metaRow}>
            {locationLine ? <Text style={styles.metaText}>{locationLine}</Text> : null}
            {profileData?.work_type ? (
              <View style={styles.workTypePill}>
                <Text style={styles.workTypePillText}>{profileData.work_type}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Today's Intent card ── */}
        {todayIntent ? (
          <View style={styles.intentCard}>
            <View style={styles.intentCardHeader}>
              <Text style={styles.intentLabel}>TODAY'S FOCUS</Text>
              <View style={styles.intentDot} />
            </View>
            <Text style={styles.intentTask}>{todayIntent.task_description}</Text>
            <View style={styles.intentMeta}>
              <Text style={styles.intentMetaText}>
                {WORK_STYLE_EMOJI[todayIntent.work_style] ?? ''} {todayIntent.work_style}
              </Text>
              <Text style={styles.intentMetaDivider}>·</Text>
              <Text style={styles.intentMetaText}>
                {LOCATION_EMOJI[todayIntent.location_type] ?? ''} {todayIntent.location_type}
                {todayIntent.location_name ? ` · ${todayIntent.location_name}` : ''}
              </Text>
              <Text style={styles.intentMetaDivider}>·</Text>
              <Text style={styles.intentMetaText}>
                {formatDisplayTime(todayIntent.available_from)} – {formatDisplayTime(todayIntent.available_until)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.intentCard, styles.intentCardEmpty]}>
            <Text style={styles.intentLabel}>TODAY'S FOCUS</Text>
            <Text style={styles.intentEmptyText}>Share what you're working on today</Text>
            <TouchableOpacity
              style={styles.intentCta}
              onPress={() => navigation.getParent()?.navigate('Discover' as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.intentCtaText}>Set Today's Focus</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Field rows ── */}
        {(aboutYouRows.length > 0 || workSchoolRows.length > 0 || locationRows.length > 0 || workTypeRows.length > 0) ? (
          <View style={styles.fieldsArea}>
            {renderGroup(aboutYouRows)}

            {aboutYouRows.length > 0 && workSchoolRows.length > 0 ? <View style={styles.groupSep} /> : null}
            {renderGroup(workSchoolRows)}

            {(aboutYouRows.length > 0 || workSchoolRows.length > 0) && locationRows.length > 0 ? <View style={styles.groupSep} /> : null}
            {renderGroup(locationRows)}

            {(aboutYouRows.length > 0 || workSchoolRows.length > 0 || locationRows.length > 0) && workTypeRows.length > 0 ? <View style={styles.groupSep} /> : null}
            {renderGroup(workTypeRows)}
          </View>
        ) : null}

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
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[12],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  initialsText: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  photoStack: {
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  photoBlock: {
    gap: spacing[2],
  },
  photoFrame: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  primaryFrame: {
    aspectRatio: 1.1,
  },
  secondaryFrame: {
    aspectRatio: 1.72,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  initialsFrame: {
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  nameBlock: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  metaText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  workTypePill: {
    backgroundColor: colors.accentPrimaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  workTypePillText: {
    fontSize: 12,
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  fieldsArea: {
    backgroundColor: theme.surface,
    marginHorizontal: -spacing[4],
    paddingBottom: spacing[4],
    marginTop: spacing[3],
  },
  fieldRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  rowSep: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginHorizontal: spacing[4],
  },
  groupSep: {
    height: 8,
    backgroundColor: colors.bgSecondary,
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
  intentCard: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    backgroundColor: colors.accentPrimaryLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#D4E4D8',
  },
  intentCardEmpty: {
    backgroundColor: theme.surface,
    borderColor: colors.borderDefault,
  },
  intentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  intentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  intentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  intentTask: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
    lineHeight: 24,
    marginBottom: spacing[3],
  },
  intentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
  },
  intentMetaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  intentMetaDivider: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  intentEmptyText: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  intentCta: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  intentCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
