import { useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

type PermissionState = {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
  mediaLibrary: PermissionStatus;
};

type PermissionName = keyof PermissionState;

export function usePermissions() {
  const [cameraPermission, requestCameraPermission_] = useCameraPermissions();
  const [mediaLibPermission, requestMediaLibPermission_] = ImagePicker.useMediaLibraryPermissions();
  const [locForegroundPermission, requestLocForegroundPermission] = Location.useForegroundPermissions();

  const [state, setState] = useState<PermissionState>({
    camera: 'undetermined',
    microphone: 'undetermined',
    location: 'undetermined',
    mediaLibrary: 'undetermined',
  });

  useEffect(() => {
    setState({
      camera: cameraPermission?.granted
        ? 'granted'
        : cameraPermission?.status === 'denied'
          ? 'denied'
          : 'undetermined',
      microphone: cameraPermission?.granted
        ? 'granted'
        : cameraPermission?.status === 'denied'
          ? 'denied'
          : 'undetermined',
      location: locForegroundPermission?.granted
        ? 'granted'
        : locForegroundPermission?.status === 'denied'
          ? 'denied'
          : 'undetermined',
      mediaLibrary: mediaLibPermission?.granted
        ? 'granted'
        : mediaLibPermission?.status === 'denied'
          ? 'denied'
          : 'undetermined',
    });
  }, [cameraPermission, locForegroundPermission, mediaLibPermission]);

  const requestCamera = async (): Promise<boolean> => {
    const result = await requestCameraPermission_();
    return result.granted;
  };

  const requestMediaLibrary = async (): Promise<boolean> => {
    const result = await requestMediaLibPermission_();
    return result.granted;
  };

  const requestLocation = async (): Promise<boolean> => {
    const result = await requestLocForegroundPermission();
    return result.granted;
  };

  const ensure = async (permission: PermissionName): Promise<boolean> => {
    switch (permission) {
      case 'camera':
      case 'microphone':
        if (state[permission] === 'granted') return true;
        if (state[permission] === 'denied') {
          showSettingsAlert(`${permission} permission`);
          return false;
        }
        return requestCamera();
      case 'location':
        if (state.location === 'granted') return true;
        if (state.location === 'denied') {
          showSettingsAlert('Location permission');
          return false;
        }
        return requestLocation();
      case 'mediaLibrary':
        if (state.mediaLibrary === 'granted') return true;
        if (state.mediaLibrary === 'denied') {
          showSettingsAlert('Media Library permission');
          return false;
        }
        return requestMediaLibrary();
    }
  };

  return { state, ensure, requestCamera, requestMediaLibrary, requestLocation };
}

function showSettingsAlert(label: string) {
  Alert.alert(
    `${label} Required`,
    `${label} was denied. Please enable it in Settings to use this feature.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
}
