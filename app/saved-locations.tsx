import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { LocationGeocodedAddress } from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useLocation, type LocationCoords } from '../hooks/useLocation';

type LocationType = 'home' | 'work' | 'site' | 'other';

type SavedLocation = {
  id: string;
  name: string;
  address: string;
  area: string;
  type: LocationType;
  coords?: LocationCoords;
};

const TYPES: { value: LocationType; label: string; icon: string; color: string }[] = [
  { value: 'home', label: 'Home', icon: 'home', color: Colors.primary },
  { value: 'work', label: 'Work', icon: 'work', color: Colors.secondary },
  { value: 'site', label: 'Site', icon: 'construction', color: Colors.tertiary },
  { value: 'other', label: 'Other', icon: 'place', color: Colors.outline },
];
const typeMeta = (t: LocationType) => TYPES.find((x) => x.value === t)!;

const INITIAL_LOCATIONS: SavedLocation[] = [
  { id: '1', name: 'Home', address: '12 Adeola Odeku Street', area: 'Victoria Island, Lagos', type: 'home', coords: { latitude: 6.4302, longitude: 3.4216 } },
  { id: '2', name: 'Office', address: '35 Marina Road', area: 'Lagos Island, Lagos', type: 'work', coords: { latitude: 6.4500, longitude: 3.3958 } },
  { id: '3', name: 'Lekki site', address: 'Plot 7, Lekki Phase 2', area: 'Lekki, Lagos', type: 'site', coords: { latitude: 6.4433, longitude: 3.5355 } },
  { id: '4', name: 'Warehouse', address: '18 Ikorodu Road', area: 'Ikeja, Lagos', type: 'other' },
];

// Great-circle distance in km.
const distanceKm = (a: LocationCoords, b: LocationCoords) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`);

const streetLine = (p: LocationGeocodedAddress) =>
  [p.streetNumber, p.street].filter(Boolean).join(' ') || p.name || 'Unnamed road';

const areaLine = (p: LocationGeocodedAddress) =>
  Array.from(new Set([p.district ?? p.subregion, p.city ?? p.region].filter(Boolean))).join(', ');

function TypeChips({ value, onChange }: { value: LocationType; onChange: (t: LocationType) => void }) {
  return (
    <View style={styles.chipRow}>
      {TYPES.map((t) => {
        const active = value === t.value;
        return (
          <TouchableOpacity key={t.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(t.value)} activeOpacity={0.7}>
            <MaterialIcons name={t.icon as any} size={16} color={active ? Colors.onPrimary : Colors.onSurfaceVariant} />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SavedLocationsScreen() {
  const insets = useSafeAreaInsets();
  const { coords, place, loading, permission, error, refresh } = useLocation();
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [search, setSearch] = useState('');

  const [detectedName, setDetectedName] = useState('');
  const [detectedType, setDetectedType] = useState<LocationType>('other');

  const [form, setForm] = useState<SavedLocation | null>(null);
  const isEditing = !!form && locations.some((l) => l.id === form.id);

  const alreadySaved = useMemo(
    () => (coords ? locations.find((l) => l.coords && distanceKm(l.coords, coords) < 0.05) : undefined),
    [coords, locations]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? locations.filter((l) => `${l.name} ${l.address} ${l.area}`.toLowerCase().includes(q)) : locations;
  }, [locations, search]);

  const saveDetected = () => {
    if (!coords || !place || !detectedName.trim()) return;
    setLocations((prev) => [
      ...prev,
      { id: String(Date.now()), name: detectedName.trim(), address: streetLine(place), area: areaLine(place), type: detectedType, coords },
    ]);
    setDetectedName('');
    setDetectedType('other');
  };

  const openAdd = () => setForm({ id: String(Date.now()), name: '', address: '', area: '', type: 'other' });

  const fillFormFromGps = () => {
    if (!coords || !place) {
      refresh();
      return;
    }
    setForm((f) => f && { ...f, address: streetLine(place), area: areaLine(place), coords });
  };

  const saveForm = () => {
    if (!form) return;
    if (!form.name.trim() || !form.address.trim()) {
      Alert.alert('Missing details', 'Give the location a name and an address.');
      return;
    }
    const clean = { ...form, name: form.name.trim(), address: form.address.trim(), area: form.area.trim() };
    setLocations((prev) => (isEditing ? prev.map((l) => (l.id === clean.id ? clean : l)) : [...prev, clean]));
    setForm(null);
  };

  const handleDelete = (loc: SavedLocation) =>
    Alert.alert('Remove location', `Remove "${loc.name}" from saved locations?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setLocations((prev) => prev.filter((l) => l.id !== loc.id)) },
    ]);

  const openDirections = (loc: SavedLocation) => {
    const query = loc.coords ? `${loc.coords.latitude},${loc.coords.longitude}` : `${loc.address}, ${loc.area}`;
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${encodeURIComponent(query)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open maps'));
  };

  const renderCurrent = () => {
    if (loading) {
      return (
        <View style={styles.currentRow}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.currentMuted}>Finding where you are…</Text>
        </View>
      );
    }
    if (permission === 'denied' || error || !coords || !place) {
      const denied = permission === 'denied';
      return (
        <View style={styles.currentRow}>
          <View style={[styles.pin, { backgroundColor: Colors.surfaceVariant }]}>
            <MaterialIcons name="location-disabled" size={22} color={Colors.outline} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.currentTitle}>{denied ? 'Location is off' : "Couldn't find your location"}</Text>
            <Text style={styles.currentMuted}>{denied ? 'Allow location to save where you are.' : 'Check GPS and try again.'}</Text>
          </View>
          <TouchableOpacity style={styles.smallPill} onPress={denied ? () => Linking.openSettings() : refresh} activeOpacity={0.7}>
            <Text style={styles.smallPillText}>{denied ? 'Settings' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        <View style={styles.currentRow}>
          <View style={styles.pin}>
            <MaterialIcons name="my-location" size={22} color={Colors.onPrimary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.currentLabel}>You are here</Text>
            <Text style={styles.currentTitle} numberOfLines={1}>{streetLine(place)}</Text>
            <Text style={styles.currentMuted} numberOfLines={1}>{areaLine(place)}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={refresh} hitSlop={6} accessibilityLabel="Refresh location">
            <MaterialIcons name="refresh" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {alreadySaved ? (
          <View style={styles.savedNote}>
            <MaterialIcons name="check-circle" size={18} color={Colors.primary} />
            <Text style={styles.savedNoteText}>Saved as <Text style={styles.bold}>{alreadySaved.name}</Text></Text>
          </View>
        ) : (
          <View style={styles.saveBlock}>
            <Text style={styles.label}>Name this place</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Home, Ikeja shop, Lekki site"
              placeholderTextColor={Colors.outline}
              value={detectedName}
              onChangeText={setDetectedName}
              returnKeyType="done"
              onSubmitEditing={saveDetected}
            />
            <TypeChips value={detectedType} onChange={setDetectedType} />
            <TouchableOpacity
              style={[styles.cta, !detectedName.trim() && styles.ctaDisabled]}
              onPress={saveDetected}
              disabled={!detectedName.trim()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="bookmark-add" size={20} color={Colors.onSecondary} />
              <Text style={styles.ctaText}>Save this location</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Saved Locations', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.card, styles.currentCard]}>{renderCurrent()}</View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved</Text>
          <Text style={styles.sectionCount}>{locations.length}</Text>
        </View>

        {locations.length > 3 && (
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.outline} />
            <TextInput style={styles.searchInput} placeholder="Search saved locations" placeholderTextColor={Colors.outline} value={search} onChangeText={setSearch} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={Colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {filtered.map((loc) => {
          const meta = typeMeta(loc.type);
          return (
            <View key={loc.id} style={styles.card}>
              <View style={styles.locRow}>
                <View style={[styles.typeTile, { backgroundColor: meta.color + '1a' }]}>
                  <MaterialIcons name={meta.icon as any} size={22} color={meta.color} />
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.locName} numberOfLines={1}>{loc.name}</Text>
                    {loc.type !== 'other' && (
                      <View style={[styles.tag, { backgroundColor: meta.color + '1a' }]}>
                        <Text style={[styles.tagText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.locAddress} numberOfLines={1}>{loc.address}</Text>
                  <Text style={styles.locArea} numberOfLines={1}>
                    {loc.area}
                    {coords && loc.coords ? `  ·  ${formatDistance(distanceKm(coords, loc.coords))}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.locActions}>
                <TouchableOpacity style={styles.directionsBtn} onPress={() => openDirections(loc)} activeOpacity={0.7}>
                  <MaterialIcons name="directions" size={18} color={Colors.primary} />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
                <View style={styles.flex} />
                <TouchableOpacity style={styles.iconBtn} onPress={() => setForm(loc)} hitSlop={6} accessibilityLabel={`Edit ${loc.name}`}>
                  <MaterialIcons name="edit" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(loc)} hitSlop={6} accessibilityLabel={`Remove ${loc.name}`}>
                  <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="location-off" size={36} color={Colors.outline} />
            <Text style={styles.emptyTitle}>{search ? 'No matches' : 'No saved locations yet'}</Text>
            <Text style={styles.emptySub}>{search ? 'Try a different search.' : 'Save your current location above or add one manually.'}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.7}>
          <MaterialIcons name="add-location-alt" size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add address manually</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!form} transparent animationType="slide" onRequestClose={() => setForm(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setForm(null)} />
          {form && (
            <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{isEditing ? 'Edit location' : 'New location'}</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setForm(null)} hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Home, Office, Site B"
                  placeholderTextColor={Colors.outline}
                  value={form.name}
                  onChangeText={(name) => setForm({ ...form, name })}
                  autoFocus={!isEditing}
                />
                <TypeChips value={form.type} onChange={(type) => setForm({ ...form, type })} />

                <TouchableOpacity style={styles.gpsBtn} onPress={fillFormFromGps} activeOpacity={0.7}>
                  {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : <MaterialIcons name="my-location" size={20} color={Colors.primary} />}
                  <View style={styles.flex}>
                    <Text style={styles.gpsTitle}>Use my current location</Text>
                    <Text style={styles.gpsSub} numberOfLines={1}>
                      {place ? `${streetLine(place)}, ${areaLine(place)}` : 'Fills the address from GPS'}
                    </Text>
                  </View>
                  {form.coords && coords && distanceKm(form.coords, coords) < 0.05 && (
                    <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 42 Awolowo Road"
                  placeholderTextColor={Colors.outline}
                  value={form.address}
                  onChangeText={(address) => setForm({ ...form, address, coords: undefined })}
                />
                <Text style={[styles.label, styles.labelGap]}>Area / City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ikeja, Lagos"
                  placeholderTextColor={Colors.outline}
                  value={form.area}
                  onChangeText={(area) => setForm({ ...form, area })}
                />

                <TouchableOpacity style={[styles.cta, styles.sheetCta]} onPress={saveForm} activeOpacity={0.8}>
                  <Text style={styles.ctaText}>{isEditing ? 'Save changes' : 'Save location'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const shadow = {
  shadowColor: '#1b1c1c',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },

  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 12, ...shadow },
  currentCard: { borderLeftWidth: 4, borderLeftColor: Colors.primary, marginBottom: 24 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pin: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  currentLabel: { fontSize: 12, fontWeight: '600', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  currentTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface, marginTop: 2 },
  currentMuted: { fontSize: 14, color: Colors.outline, marginTop: 2 },
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: Colors.greenTint + '80' },
  savedNoteText: { fontSize: 14, color: Colors.onSurface },
  saveBlock: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.divider },

  smallPill: { paddingHorizontal: 16, height: 36, justifyContent: 'center', borderRadius: 999, backgroundColor: Colors.primary },
  smallPillText: { fontSize: 14, fontWeight: '600', color: Colors.onPrimary },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  labelGap: { marginTop: 16 },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
    fontSize: 16,
    color: Colors.onSurface,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 16 },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface },
  sectionCount: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceVariant, backgroundColor: Colors.surfaceVariant, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },

  locRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeTile: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locName: { fontSize: 16, fontWeight: '600', color: Colors.onSurface, flexShrink: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  tagText: { fontSize: 12, fontWeight: '600' },
  locAddress: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 2 },
  locArea: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  locActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Colors.greenTint + '99' },
  directionsText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline, textAlign: 'center', paddingHorizontal: 32 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
    marginTop: 4,
  },
  addBtnText: { fontSize: 16, fontWeight: '600', color: Colors.primary },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 8, maxHeight: '90%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface },
  sheetCta: { marginTop: 24 },

  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.greenTint + '4d',
  },
  gpsTitle: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  gpsSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
});
