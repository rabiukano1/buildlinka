import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { usePermissions } from './usePermissions';

export type MediaAsset = {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
};

export function useMediaPicker() {
  const { ensure } = usePermissions();
  const [loading, setLoading] = useState(false);

  const pickFromGallery = useCallback(async (): Promise<MediaAsset | null> => {
    const ok = await ensure('mediaLibrary');
    if (!ok) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.length) return null;
      const a = result.assets[0];
      return { uri: a.uri, width: a.width, height: a.height, type: a.type as 'image' | 'video' };
    } finally {
      setLoading(false);
    }
  }, [ensure]);

  const takePhoto = useCallback(async (): Promise<MediaAsset | null> => {
    const ok = await ensure('camera');
    if (!ok) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.length) return null;
      const a = result.assets[0];
      return { uri: a.uri, width: a.width, height: a.height, type: 'image' };
    } finally {
      setLoading(false);
    }
  }, [ensure]);

  const pickAvatar = useCallback(async (): Promise<string | null> => {
    const action = await new Promise<'camera' | 'gallery' | null>((resolve) => {
      Alert.alert('Change Profile Photo', 'Choose a source', [
        { text: 'Camera', onPress: () => resolve('camera') },
        { text: 'Gallery', onPress: () => resolve('gallery') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
    if (!action) return null;
    const asset = action === 'camera' ? await takePhoto() : await pickFromGallery();
    return asset?.uri ?? null;
  }, [pickFromGallery, takePhoto]);

  return { pickFromGallery, takePhoto, pickAvatar, loading };
}
