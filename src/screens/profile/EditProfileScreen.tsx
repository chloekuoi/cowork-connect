import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, theme, spacing, borderRadius, touchTarget } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import PhotoSlots, { PhotoSlotItem } from '../../components/profile/PhotoSlots';
import { deletePhoto, getPhotos, pickImage, setPrimaryPhoto, uploadPhoto } from '../../services/photoService';
import { getFullProfile, updateProfile } from '../../services/profileService';

const WORK_TYPES = [
  'Remote Employee',
  'Freelancer',
  'Founder',
  'Student',
  'Digital Nomad',
  'Other',
];

const PHOTO_PROMPTS = [
  "Hi, I'm a real person 👋",
  'Proof I touch grass sometimes',
  'What my camera roll actually looks like',
  'Currently building something...',
  "A photo that shows your vibe",
];

const PHOTO_SUBTITLES = [
  'Not a stock photo, promise',
  'Hobbies, activities, general humanness',
  'Candid is an understatement',
  'Still figuring it out, send help',
  '',
];

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

type FormState = {
  username: string;
  name: string;
  tagline: string;
  currently_working_on: string;
  work: string;
  school: string;
  neighborhood: string;
  city: string;
  work_type: string;
  birthday: string;
};

const EMPTY_FORM: FormState = {
  username: '',
  name: '',
  tagline: '',
  currently_working_on: '',
  work: '',
  school: '',
  neighborhood: '',
  city: '',
  work_type: '',
  birthday: '',
};

function toInputValue(value: string | null | undefined): string {
  return value ?? '';
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function validateUsername(value: string): string | null {
  const normalized = normalizeUsername(value);

  if (normalized.length < 3) {
    return 'Username must be at least 3 characters.';
  }

  if (normalized.length > 24) {
    return 'Username must be 24 characters or fewer.';
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return 'Username can use only lowercase letters, numbers, and underscores.';
  }

  return null;
}

function formatDateLabel(value: string): string {
  if (!value) return 'Select birthday';
  return value;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EditProfileScreen({ navigation }: Props) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<PhotoSlotItem[]>([]);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [profileResult, photosResult] = await Promise.all([getFullProfile(user.id), getPhotos(user.id)]);

    if (profileResult.data.profile) {
      const profile = profileResult.data.profile;
      setForm({
        username: toInputValue(profile.username),
        name: toInputValue(profile.name),
        tagline: toInputValue(profile.tagline),
        currently_working_on: toInputValue(profile.currently_working_on),
        work: toInputValue(profile.work),
        school: toInputValue(profile.school),
        neighborhood: toInputValue(profile.neighborhood),
        city: toInputValue(profile.city),
        work_type: toInputValue(profile.work_type),
        birthday: toInputValue(profile.birthday),
      });
    } else {
      setForm(EMPTY_FORM);
    }

    if (photosResult.error) {
      Alert.alert('Photos unavailable', photosResult.error);
    }
    setPhotos(
      photosResult.data.map((photo) => ({
        position: photo.position,
        photo_url: photo.photo_url,
      }))
    );

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handlePickAndUpload = useCallback(
    async (position: number) => {
      if (!user || photoBusy) return;

      const { uri, error: pickError } = await pickImage();
      if (pickError) {
        Alert.alert('Photo access required', pickError);
        return;
      }

      if (!uri) return;

      setPhotoBusy(true);
      const result = await uploadPhoto(user.id, uri, position);
      if (result.error) {
        Alert.alert('Upload failed', result.error);
        setPhotoBusy(false);
        return;
      }

      const refreshResult = await getPhotos(user.id);
      if (refreshResult.error) {
        Alert.alert('Refresh failed', refreshResult.error);
      } else {
        setPhotos(
          refreshResult.data.map((photo) => ({
            position: photo.position,
            photo_url: photo.photo_url,
          }))
        );
      }
      setPhotoBusy(false);
    },
    [photoBusy, user]
  );

  const handleDeletePhoto = useCallback(
    async (position: number) => {
      if (!user || photoBusy) return;
      setPhotoBusy(true);

      const result = await deletePhoto(user.id, position);
      if (result.error) {
        Alert.alert('Delete failed', result.error);
      }

      const refreshResult = await getPhotos(user.id);
      if (refreshResult.error) {
        Alert.alert('Refresh failed', refreshResult.error);
      } else {
        setPhotos(
          refreshResult.data.map((photo) => ({
            position: photo.position,
            photo_url: photo.photo_url,
          }))
        );
      }

      setPhotoBusy(false);
    },
    [photoBusy, user]
  );

  const handleSetPrimary = useCallback(
    async (position: number) => {
      if (!user || photoBusy || position === 0) return;
      setPhotoBusy(true);

      const result = await setPrimaryPhoto(user.id, position);
      if (result.error) {
        Alert.alert('Set primary failed', result.error);
      } else {
        setPhotos(
          result.data.map((photo) => ({
            position: photo.position,
            photo_url: photo.photo_url,
          }))
        );
      }

      setPhotoBusy(false);
    },
    [photoBusy, user]
  );

  const openPhotoActionSheet = useCallback(
    (position: number) => {
      const options = position === 0
        ? ['Change Photo', 'Remove Photo', 'Cancel']
        : ['Change Photo', 'Remove Photo', 'Set as Primary', 'Cancel'];

      Alert.alert('Photo options', undefined, [
        { text: options[0], onPress: () => void handlePickAndUpload(position) },
        { text: options[1], style: 'destructive', onPress: () => void handleDeletePhoto(position) },
        ...(position !== 0
          ? [{ text: options[2], onPress: () => void handleSetPrimary(position) }]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [handleDeletePhoto, handlePickAndUpload, handleSetPrimary]
  );

  const onPhotoSlotAdd = useCallback(
    async (position: number) => {
      await handlePickAndUpload(position);
    },
    [handlePickAndUpload]
  );

  const onPhotoSlotRemove = useCallback(
    (position: number) => {
      openPhotoActionSheet(position);
    },
    [openPhotoActionSheet]
  );

  const onPhotoSlotSetPrimary = useCallback(
    (position: number) => {
      openPhotoActionSheet(position);
    },
    [openPhotoActionSheet]
  );

  const birthdayDate = useMemo(() => {
    if (!form.birthday) return new Date();
    const parsed = new Date(form.birthday);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [form.birthday]);

  const handleBirthdayChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBirthdayPicker(false);
    }

    if (selectedDate) {
      setForm((prev) => ({
        ...prev,
        birthday: toIsoDate(selectedDate),
      }));
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;

    const normalizedUsername = normalizeUsername(form.username);
    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      Alert.alert('Invalid username', usernameError);
      return;
    }

    setSaving(true);
    const { error } = await updateProfile(user.id, {
      username: normalizedUsername,
      name: toNullable(form.name),
      tagline: toNullable(form.tagline),
      currently_working_on: toNullable(form.currently_working_on),
      work: toNullable(form.work),
      school: toNullable(form.school),
      neighborhood: toNullable(form.neighborhood),
      city: toNullable(form.city),
      work_type: toNullable(form.work_type),
      birthday: toNullable(form.birthday),
    });

    if (error) {
      setSaving(false);
      Alert.alert('Save failed', error);
      return;
    }

    await refreshProfile();
    setSaving(false);
    navigation.goBack();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving || photoBusy}>
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || photoBusy}>
          <Text style={[styles.headerButton, styles.saveButton]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PhotoSlots
          photos={photos}
          totalSlots={5}
          onAddPhoto={onPhotoSlotAdd}
          onRemovePhoto={onPhotoSlotRemove}
          onSetPrimary={onPhotoSlotSetPrimary}
          prompts={PHOTO_PROMPTS}
          editable={!saving && !photoBusy}
        />

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={form.username}
            onChangeText={(text) => setForm((prev) => ({ ...prev, username: normalizeUsername(text) }))}
            placeholder="username"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>Use lowercase letters, numbers, and underscores.</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
            placeholder="Your name"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>Tagline</Text>
          <TextInput
            style={styles.input}
            value={form.tagline}
            onChangeText={(text) => setForm((prev) => ({ ...prev, tagline: text }))}
            placeholder="One-line intro"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>Currently Working On</Text>
          <TextInput
            style={styles.input}
            value={form.currently_working_on}
            onChangeText={(text) => setForm((prev) => ({ ...prev, currently_working_on: text }))}
            placeholder="What are you building?"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>Work</Text>
          <TextInput
            style={styles.input}
            value={form.work}
            onChangeText={(text) => setForm((prev) => ({ ...prev, work: text }))}
            placeholder="Company"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>School</Text>
          <TextInput
            style={styles.input}
            value={form.school}
            onChangeText={(text) => setForm((prev) => ({ ...prev, school: text }))}
            placeholder="School"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>Neighborhood</Text>
          <TextInput
            style={styles.input}
            value={form.neighborhood}
            onChangeText={(text) => setForm((prev) => ({ ...prev, neighborhood: text }))}
            placeholder="Neighborhood"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={(text) => setForm((prev) => ({ ...prev, city: text }))}
            placeholder="City"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Birthday</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowBirthdayPicker(true)}
            disabled={saving || photoBusy}
          >
            <Text style={styles.dateButtonText}>{formatDateLabel(form.birthday)}</Text>
          </TouchableOpacity>
          {showBirthdayPicker && (
            <DateTimePicker
              value={birthdayDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleBirthdayChange}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Work Type</Text>
          <View style={styles.pillsRow}>
            {WORK_TYPES.map((workType) => {
              const selected = form.work_type === workType;
              return (
                <TouchableOpacity
                  key={workType}
                  style={[styles.pill, selected && styles.pillSelected]}
                  onPress={() => setForm((prev) => ({ ...prev, work_type: workType }))}
                  disabled={saving || photoBusy}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{workType}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: theme.surface,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerButton: {
    fontSize: 16,
    color: theme.textSecondary,
    minWidth: 64,
  },
  saveButton: {
    textAlign: 'right',
    color: theme.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[5],
  },
  section: {
    gap: spacing[2],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: spacing[2],
  },
  input: {
    minHeight: touchTarget.min,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: theme.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 16,
    color: theme.text,
  },
  helperText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: -4,
  },
  dateButton: {
    minHeight: touchTarget.min,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: theme.surface,
    paddingHorizontal: spacing[3],
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.text,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  pill: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: theme.surface,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  pillSelected: {
    borderColor: theme.primary,
    backgroundColor: colors.accentPrimaryLight,
  },
  pillText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
});
