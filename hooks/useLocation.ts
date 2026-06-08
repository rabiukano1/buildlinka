import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

type LocationState = {
  coords: LocationCoords | null;
  address: string | null;
  error: string | null;
  loading: boolean;
  permission: 'undetermined' | 'granted' | 'denied';
  refresh: () => Promise<void>;
};

export function useLocation(): LocationState {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        setError('Location permission denied');
        setLoading(false);
        return;
      }
      setPermission('granted');

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const a = geocode[0];
        const parts = [a.city, a.region, a.country].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { coords, address, error, loading, permission, refresh };
}
