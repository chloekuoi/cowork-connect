import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { ProfilePhoto } from '../types';

const AVATAR_BUCKET = 'avatars';
const MAX_PHOTO_POSITION = 4;

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

function getPath(userId: string, position: number): string {
  return `${userId}/${position}.jpg`;
}

function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;
  const message = (error as { message?: string }).message;
  return message || fallback;
}

function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position >= 0 && position <= MAX_PHOTO_POSITION;
}

async function uploadBlob(path: string, uri: string): Promise<{ error: string | null }> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) {
      return { error: toErrorMessage(error, 'Failed to upload image') };
    }

    return { error: null };
  } catch (error) {
    return { error: toErrorMessage(error, 'Failed to upload image') };
  }
}

export async function pickImage(): Promise<{ uri: string | null; error: string | null }> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { uri: null, error: 'Photo library permission is required.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets?.[0]?.uri) {
    return { uri: null, error: null };
  }

  return { uri: result.assets[0].uri, error: null };
}

export async function getPhotos(userId: string): Promise<ServiceResult<ProfilePhoto[]>> {
  const { data, error } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) {
    const message = toErrorMessage(error, 'Failed to fetch photos');
    console.error('Error fetching photos:', message);
    return { data: [], error: message };
  }

  return { data: (data || []) as ProfilePhoto[], error: null };
}

export async function uploadPhoto(
  userId: string,
  imageUri: string,
  position: number
): Promise<ServiceResult<ProfilePhoto | null>> {
  if (!isValidPosition(position)) {
    return { data: null, error: 'Invalid photo slot.' };
  }

  const path = getPath(userId, position);
  const upload = await uploadBlob(path, imageUri);

  if (upload.error) {
    console.error('Error uploading photo:', upload.error);
    return { data: null, error: upload.error };
  }

  const publicUrl = getPublicUrl(path);

  const { data, error } = await supabase
    .from('profile_photos')
    .upsert(
      {
        user_id: userId,
        photo_url: publicUrl,
        position,
      },
      { onConflict: 'user_id,position' }
    )
    .select('*')
    .single();

  if (error) {
    const message = toErrorMessage(error, 'Failed to save photo record');
    console.error('Error upserting profile photo:', message);
    return { data: null, error: message };
  }

  if (position === 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) {
      const message = toErrorMessage(profileError, 'Failed to sync primary photo');
      console.error('Error syncing profile photo_url:', message);
      return { data: data as ProfilePhoto, error: message };
    }
  }

  return { data: data as ProfilePhoto, error: null };
}

export async function deletePhoto(
  userId: string,
  position: number
): Promise<ServiceResult<{ promoted: boolean }>> {
  if (!isValidPosition(position)) {
    return { data: { promoted: false }, error: 'Invalid photo slot.' };
  }

  const { data: existingPhoto, error: existingError } = await supabase
    .from('profile_photos')
    .select('*')
    .eq('user_id', userId)
    .eq('position', position)
    .maybeSingle();

  if (existingError) {
    const message = toErrorMessage(existingError, 'Failed to read photo before delete');
    console.error('Error loading photo to delete:', message);
    return { data: { promoted: false }, error: message };
  }

  if (!existingPhoto) {
    return { data: { promoted: false }, error: null };
  }

  const { error: storageError } = await supabase.storage.from(AVATAR_BUCKET).remove([getPath(userId, position)]);
  if (storageError) {
    console.error('Storage delete warning:', toErrorMessage(storageError, 'Unable to remove file from storage'));
  }

  const { error: deleteError } = await supabase
    .from('profile_photos')
    .delete()
    .eq('user_id', userId)
    .eq('position', position);

  if (deleteError) {
    const message = toErrorMessage(deleteError, 'Failed to delete photo record');
    console.error('Error deleting profile photo row:', message);
    return { data: { promoted: false }, error: message };
  }

  if (position !== 0) {
    return { data: { promoted: false }, error: null };
  }

  const { data: remainingPhotos, error: remainingError } = await getPhotos(userId);
  if (remainingError) {
    return { data: { promoted: false }, error: remainingError };
  }

  if (remainingPhotos.length === 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) {
      const message = toErrorMessage(profileError, 'Failed to clear profile photo');
      console.error('Error clearing profiles.photo_url:', message);
      return { data: { promoted: false }, error: message };
    }

    return { data: { promoted: false }, error: null };
  }

  const nextPhoto = remainingPhotos[0];

  if (nextPhoto.position !== 0) {
    const fromPath = getPath(userId, nextPhoto.position);
    const toPath = getPath(userId, 0);

    const { error: moveError } = await supabase.storage.from(AVATAR_BUCKET).move(fromPath, toPath);
    if (moveError) {
      const message = toErrorMessage(moveError, 'Failed to promote next photo');
      console.error('Error moving promoted photo in storage:', message);
      return { data: { promoted: false }, error: message };
    }

    const newPrimaryUrl = getPublicUrl(toPath);
    const { error: updatePhotoError } = await supabase
      .from('profile_photos')
      .update({ position: 0, photo_url: newPrimaryUrl })
      .eq('id', nextPhoto.id);

    if (updatePhotoError) {
      const message = toErrorMessage(updatePhotoError, 'Failed to update promoted photo row');
      console.error('Error updating promoted photo row:', message);
      return { data: { promoted: false }, error: message };
    }
  }

  const finalPrimaryUrl = getPublicUrl(getPath(userId, 0));
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ photo_url: finalPrimaryUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) {
    const message = toErrorMessage(profileError, 'Failed to sync promoted primary photo');
    console.error('Error syncing promoted profile photo_url:', message);
    return { data: { promoted: true }, error: message };
  }

  return { data: { promoted: true }, error: null };
}

export async function setPrimaryPhoto(
  userId: string,
  fromPosition: number
): Promise<ServiceResult<ProfilePhoto[]>> {
  if (!isValidPosition(fromPosition)) {
    return { data: [], error: 'Invalid photo slot.' };
  }

  if (fromPosition === 0) {
    return getPhotos(userId);
  }

  const { data: photos, error: photosError } = await getPhotos(userId);
  if (photosError) {
    return { data: [], error: photosError };
  }

  const source = photos.find((photo) => photo.position === fromPosition);
  if (!source) {
    return { data: photos, error: 'Photo not found in selected slot.' };
  }

  const hasPrimary = photos.some((photo) => photo.position === 0);

  if (!hasPrimary) {
    const fromPath = getPath(userId, fromPosition);
    const toPath = getPath(userId, 0);

    const { error: moveError } = await supabase.storage.from(AVATAR_BUCKET).move(fromPath, toPath);
    if (moveError) {
      const message = toErrorMessage(moveError, 'Failed to set primary photo');
      console.error('Error moving photo to primary slot:', message);
      return { data: photos, error: message };
    }

    const newPrimaryUrl = getPublicUrl(toPath);
    const { error: updatePhotoError } = await supabase
      .from('profile_photos')
      .update({ position: 0, photo_url: newPrimaryUrl })
      .eq('id', source.id);

    if (updatePhotoError) {
      const message = toErrorMessage(updatePhotoError, 'Failed to update primary photo row');
      console.error('Error updating primary photo row:', message);
      return { data: photos, error: message };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ photo_url: newPrimaryUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) {
      const message = toErrorMessage(profileError, 'Failed to sync primary photo_url');
      console.error('Error syncing profiles.photo_url:', message);
      return { data: photos, error: message };
    }

    return getPhotos(userId);
  }

  const tempPath = `${userId}/__primary_swap_temp__.jpg`;
  const primaryPath = getPath(userId, 0);
  const fromPath = getPath(userId, fromPosition);

  const { error: movePrimaryToTempError } = await supabase.storage.from(AVATAR_BUCKET).move(primaryPath, tempPath);
  if (movePrimaryToTempError) {
    const message = toErrorMessage(movePrimaryToTempError, 'Failed to start photo swap');
    console.error('Error moving primary to temp:', message);
    return { data: photos, error: message };
  }

  const { error: moveSourceToPrimaryError } = await supabase.storage.from(AVATAR_BUCKET).move(fromPath, primaryPath);
  if (moveSourceToPrimaryError) {
    console.error('Error moving selected photo to primary:', toErrorMessage(moveSourceToPrimaryError, 'Failed to swap photo'));
    await supabase.storage.from(AVATAR_BUCKET).move(tempPath, primaryPath);
    return { data: photos, error: toErrorMessage(moveSourceToPrimaryError, 'Failed to swap photo') };
  }

  const { error: moveTempToSourceError } = await supabase.storage.from(AVATAR_BUCKET).move(tempPath, fromPath);
  if (moveTempToSourceError) {
    const message = toErrorMessage(moveTempToSourceError, 'Primary swap left in inconsistent state');
    console.error('Error finalizing photo swap:', message);
    return { data: photos, error: message };
  }

  const primaryUrl = getPublicUrl(primaryPath);
  const sourceUrl = getPublicUrl(fromPath);

  const { error: updatePrimaryRowError } = await supabase
    .from('profile_photos')
    .update({ photo_url: primaryUrl })
    .eq('user_id', userId)
    .eq('position', 0);

  if (updatePrimaryRowError) {
    const message = toErrorMessage(updatePrimaryRowError, 'Failed to update primary row after swap');
    console.error('Error updating primary row after swap:', message);
    return { data: photos, error: message };
  }

  const { error: updateSourceRowError } = await supabase
    .from('profile_photos')
    .update({ photo_url: sourceUrl })
    .eq('user_id', userId)
    .eq('position', fromPosition);

  if (updateSourceRowError) {
    const message = toErrorMessage(updateSourceRowError, 'Failed to update source row after swap');
    console.error('Error updating source row after swap:', message);
    return { data: photos, error: message };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ photo_url: primaryUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) {
    const message = toErrorMessage(profileError, 'Failed to sync profile primary photo');
    console.error('Error syncing profile primary photo:', message);
    return { data: photos, error: message };
  }

  return getPhotos(userId);
}
