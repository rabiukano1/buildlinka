import { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../convex/_generated/api';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Field } from '../components/EngineerUI';
import { Colors } from '../constants/Colors';
import { errorMessage } from '../lib/backend';
import { useLocation } from '../hooks/useLocation';

export default function CreateStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createStore = useMutation(api.stores.create);
  const { place, loading: locating, refresh: locate } = useLocation({ auto: false });
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Fill the area once GPS answers.
  const gpsArea = place ? [place.district ?? place.subregion, place.city ?? place.region].filter(Boolean).join(', ') : '';
  if (gpsArea && !location) setLocation(gpsArea);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await createStore({ name, location, description: description || undefined });
      router.replace('/vendor-dashboard');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Set up your store', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />
      <KeyboardAwareWrapper contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.intro}>Buyers see this on every product you list. You can change it later in Settings.</Text>
        <Field label="Store name" placeholder="e.g. Bello Building Supplies" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label="Area and city" placeholder="e.g. Ikeja, Lagos" value={location} onChangeText={setLocation} />
        <TouchableOpacity style={styles.gps} onPress={locate} disabled={locating} activeOpacity={0.7}>
          {locating ? <ActivityIndicator size="small" color={Colors.primary} /> : <MaterialIcons name="my-location" size={18} color={Colors.primary} />}
          <Text style={styles.gpsText}>Use my current location</Text>
        </TouchableOpacity>
        <Field label="What do you sell? (optional)" placeholder="Cement, rods, roofing sheets…" value={description} onChangeText={setDescription} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={[styles.cta, busy && styles.ctaOff]} onPress={submit} disabled={busy} activeOpacity={0.85}>
          {busy ? <ActivityIndicator color={Colors.onSecondary} /> : <Text style={styles.ctaText}>Create store</Text>}
        </TouchableOpacity>
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  intro: { fontSize: 15, color: Colors.onSurfaceVariant, marginBottom: 20, lineHeight: 21 },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -6, marginBottom: 16 },
  gpsText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  error: { fontSize: 14, color: Colors.error, marginBottom: 8 },
  cta: { height: 54, borderRadius: 999, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  ctaOff: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: '600', color: Colors.onSecondary },
});
