import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

type SavedLocation = {
  id: string;
  display_name: string;
  address: string;
  city: string;
  isHome?: boolean;
  isWork?: boolean;
  google_place_id: string;
};

const INITIAL_LOCATIONS: SavedLocation[] = [
  { id: '1', display_name: 'Home', address: '12, Adeola Odeku Street', city: 'Victoria Island, Lagos', isHome: true, google_place_id: 'ChIJ-bg_Sm5u3hQRkS0F0eBmF0U' },
  { id: '2', display_name: 'Office', address: '35, Marina Road', city: 'Lagos Island, Lagos', isWork: true, google_place_id: 'ChIJrTt7fGtu3hQR6o0X3Y0hC0E' },
  { id: '3', display_name: 'Site A', address: 'Plot 7, Lekki Phase 2', city: 'Lekki, Lagos', google_place_id: 'ChIJhTf8OWhu3hQRkK0X0e0mF2U' },
  { id: '4', display_name: 'Warehouse', address: '18, Ikorodu Road', city: 'Ikeja, Lagos', google_place_id: 'ChIJwT0gCm9u3hQRl1X0Y0hC2E' },
  { id: '5', display_name: 'Suppliers Hub', address: '5, Oshodi-Apapa Expressway', city: 'Oshodi, Lagos', google_place_id: 'ChIJa1T8fG9u3hQRk2X0e0mF4U' },
];

let nextId = 6;

type LocationType = 'home' | 'work' | 'other';

type DetectedLocation = {
  display_name: string;
  address: string;
  city: string;
  google_place_id: string;
};

function LocationCard({ location, index, onEdit, onDelete, onNavigate }: { location: SavedLocation; index: number; onEdit: () => void; onDelete: () => void; onNavigate: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 70, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.locCard, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <TouchableOpacity style={styles.locCardMain} onPress={onNavigate} activeOpacity={0.7}>
        <View style={[styles.locIcon, { backgroundColor: location.isHome ? Colors.primary + '12' : location.isWork ? Colors.secondary + '12' : Colors.tertiary + '12' }]}>
          <MaterialIcons name={location.isHome ? 'home' : location.isWork ? 'work' : 'location-on'} size={20} color={location.isHome ? Colors.primary : location.isWork ? Colors.secondary : Colors.tertiary} />
        </View>
        <View style={styles.locInfo}>
          <View style={styles.locLabelRow}>
            <Text style={styles.locLabel}>{location.display_name}</Text>
            {location.isHome && <View style={styles.locTag}><Text style={styles.locTagText}>HOME</Text></View>}
            {location.isWork && <View style={[styles.locTag, { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary + '25' }]}><Text style={[styles.locTagText, { color: Colors.secondary }]}>WORK</Text></View>}
          </View>
          <Text style={styles.locAddress}>{location.address}</Text>
          <View style={styles.locCityRow}>
            <MaterialIcons name="location-city" size={12} color={Colors.textLight} />
            <Text style={styles.locCity}>{location.city}</Text>
          </View>
        </View>
        <View style={styles.locNavigateBadge}>
          <MaterialIcons name="navigation" size={16} color={Colors.primary} />
        </View>
      </TouchableOpacity>
      <View style={styles.locActions}>
        <TouchableOpacity style={styles.locActionBtn} onPress={onEdit} activeOpacity={0.6}>
          <MaterialIcons name="edit" size={16} color={Colors.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locActionBtn} onPress={onDelete} activeOpacity={0.6}>
          <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function DetectionBanner({ detected, onSave, onDismiss }: { detected: DetectedLocation | null; onSave: (name: string) => void; onDismiss: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (detected) {
      setName(detected.display_name);
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [detected]);

  if (!detected) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    setSaving(true);
    onSave(name.trim());
  };

  return (
    <Animated.View style={[styles.detectBanner, { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }], opacity: anim }]}>
      <View style={styles.detectPulse}>
        <View style={styles.detectPulseRing} />
        <MaterialIcons name="my-location" size={18} color="#fff" />
      </View>
      <View style={styles.detectContent}>
        {saving ? (
          <View style={styles.detectSaving}>
            <Text style={styles.detectSavedLabel}>{name}</Text>
            <Text style={styles.detectSavedSub}>Saved to your locations</Text>
          </View>
        ) : (
          <>
            <Text style={styles.detectTitle}>Save your current location?</Text>
            <Text style={styles.detectSub}>{detected.address}, {detected.city}</Text>
            <TextInput
              style={styles.detectInput}
              placeholder="Name this location"
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <View style={styles.detectActions}>
              <TouchableOpacity style={styles.detectNoBtn} onPress={onDismiss} activeOpacity={0.7}>
                <Text style={styles.detectNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.detectYesBtn, !name.trim() && styles.detectYesBtnDisabled]} onPress={handleSave} disabled={!name.trim()} activeOpacity={0.7}>
                <MaterialIcons name="check" size={16} color="#fff" />
                <Text style={styles.detectYesText}>Yes, Save</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      {!saving && (
        <TouchableOpacity style={styles.detectDismiss} onPress={onDismiss} activeOpacity={0.7}>
          <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const MOCK_DETECTED_LOCATIONS: DetectedLocation[] = [
  { display_name: 'My Location', address: '42, Awolowo Road', city: 'Ikeja, Lagos', google_place_id: 'ChIJ-wg_Sm5u3hQRkS0F0eEtG0U' },
  { display_name: 'My Location', address: '15, Bishop Aboyade Cole', city: 'Victoria Island, Lagos', google_place_id: 'ChIJrTt7fGtu3hQR6o0X3Y0iE1A' },
  { display_name: 'My Location', address: '7, Allen Avenue', city: 'Ikeja, Lagos', google_place_id: 'ChIJhTf8OWhu3hQRkK0X0e1nG2U' },
];

export default function SavedLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [search, setSearch] = useState('');

  const [detected, setDetected] = useState<DetectedLocation | null>(null);
  const detectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formType, setFormType] = useState<LocationType>('other');
  const [detectedPlaceId, setDetectedPlaceId] = useState<string | null>(null);
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    detectionTimer.current = setTimeout(() => {
      const idx = Math.floor(Math.random() * MOCK_DETECTED_LOCATIONS.length);
      setDetected(MOCK_DETECTED_LOCATIONS[idx]);
    }, 2000);
    return () => {
      if (detectionTimer.current) clearTimeout(detectionTimer.current);
    };
  }, []);

  const filtered = locations.filter((l) =>
    l.display_name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase()) ||
    l.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleFormDetectLocation = () => {
    const idx = Math.floor(Math.random() * MOCK_DETECTED_LOCATIONS.length);
    const loc = MOCK_DETECTED_LOCATIONS[idx];
    setDetectedPlaceId(loc.google_place_id);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormLabel('');
    setFormAddress('');
    setFormCity('');
    setFormType('other');
    setDetectedPlaceId(null);
    setShowForm(true);
    Animated.spring(formAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
  };

  const openEdit = (loc: SavedLocation) => {
    setEditingId(loc.id);
    setFormLabel(loc.display_name);
    setFormAddress(loc.address);
    setFormCity(loc.city);
    setFormType(loc.isHome ? 'home' : loc.isWork ? 'work' : 'other');
    setDetectedPlaceId(null);
    setShowForm(true);
    Animated.spring(formAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
  };

  const closeForm = () => {
    Animated.timing(formAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowForm(false));
  };

  const handleSave = () => {
    if (!formLabel.trim() || !formAddress.trim() || !formCity.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    const placeId = detectedPlaceId || 'ChIJ' + Math.random().toString(36).substring(2, 10);
    if (editingId) {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, display_name: formLabel.trim(), address: formAddress.trim(), city: formCity.trim(), isHome: formType === 'home', isWork: formType === 'work' }
            : l
        )
      );
    } else {
      setLocations((prev) => [
        ...prev,
        { id: String(nextId++), display_name: formLabel.trim(), address: formAddress.trim(), city: formCity.trim(), isHome: formType === 'home', isWork: formType === 'work', google_place_id: placeId },
      ]);
    }
    setDetectedPlaceId(null);
    closeForm();
  };

  const handleSaveDetected = (name: string) => {
    if (!detected) return;
    setLocations((prev) => [
      ...prev,
      { id: String(nextId++), display_name: name, address: detected.address, city: detected.city, google_place_id: detected.google_place_id },
    ]);
    setTimeout(() => setDetected(null), 600);
  };

  const handleNavigate = (loc: SavedLocation) => {
    const mapsUrl = Platform.select({
      ios: `https://maps.apple.com/?q=${encodeURIComponent(loc.display_name)}&ll=&q=${loc.google_place_id}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.display_name)}&query_place_id=${loc.google_place_id}`,
    });
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert('Navigation', `Navigate to ${loc.display_name}\nPlace ID: ${loc.google_place_id}`);
    });
  };

  const handleDelete = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    Alert.alert('Remove Location', `Remove "${loc?.display_name}" from saved locations?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setLocations((prev) => prev.filter((l) => l.id !== id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.primary, '#0a5215', Colors.primaryContainer]}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.2 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Saved Locations</Text>
            <Text style={styles.headerSub}>{locations.length} location{locations.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.locateBtn} onPress={() => { if (detectionTimer.current) clearTimeout(detectionTimer.current); const idx = Math.floor(Math.random() * MOCK_DETECTED_LOCATIONS.length); setDetected(MOCK_DETECTED_LOCATIONS[idx]); }} activeOpacity={0.7}>
            <MaterialIcons name="my-location" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.7}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <DetectionBanner detected={detected} onSave={handleSaveDetected} onDismiss={() => setDetected(null)} />

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput style={styles.searchInput} placeholder="Search locations..." placeholderTextColor="rgba(255,255,255,0.45)" value={search} onChangeText={setSearch} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareWrapper
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <MaterialIcons name="bookmark" size={14} color={Colors.textLight} />
          <Text style={styles.sectionLabel}>YOUR LOCATIONS</Text>
        </View>

        {filtered.map((loc, i) => (
          <LocationCard key={loc.id} location={loc} index={i} onEdit={() => openEdit(loc)} onDelete={() => handleDelete(loc.id)} onNavigate={() => handleNavigate(loc)} />
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="location-off" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No locations found</Text>
            <Text style={styles.emptySub}>{search ? 'Try a different search' : 'Tap + to add your first location'}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addLocationBtn} onPress={openAdd} activeOpacity={0.7}>
          <MaterialIcons name="add-location-alt" size={20} color={Colors.primary} />
          <Text style={styles.addLocationText}>Add New Location</Text>
        </TouchableOpacity>
      </KeyboardAwareWrapper>

      <Modal visible={showForm} transparent animationType="none" onRequestClose={closeForm}>
        <View style={styles.formOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top + 24} style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Animated.View style={[styles.formPanel, { paddingBottom: insets.bottom + 8, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
              <View style={styles.formHandle}>
                <View style={styles.formHandleBar} />
              </View>

              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingId ? 'Edit Location' : 'New Location'}</Text>
                <TouchableOpacity style={styles.formClose} onPress={closeForm} activeOpacity={0.7}>
                  <MaterialIcons name="close" size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                  <TextInput style={styles.input} placeholder="e.g. Home, Office, Site B" placeholderTextColor={Colors.textMuted} value={formLabel} onChangeText={setFormLabel} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TYPE</Text>
                  <View style={styles.typeRow}>
                    {([
                      { value: 'home', label: 'Home', icon: 'home' },
                      { value: 'work', label: 'Work', icon: 'work' },
                      { value: 'other', label: 'Other', icon: 'location-on' },
                    ] as const).map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.typeChip, formType === t.value && styles.typeChipActive]}
                        onPress={() => setFormType(t.value)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name={t.icon} size={16} color={formType === t.value ? '#fff' : Colors.textLight} />
                        <Text style={[styles.typeChipText, formType === t.value && styles.typeChipTextActive]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={[styles.formDetectBtn, detectedPlaceId && styles.formDetectBtnActive]} onPress={handleFormDetectLocation} activeOpacity={0.7}>
                  <View style={[styles.formDetectPulse, detectedPlaceId && styles.formDetectPulseActive]}>
                    <MaterialIcons name={detectedPlaceId ? 'check' : 'my-location'} size={16} color={detectedPlaceId ? '#fff' : Colors.primary} />
                  </View>
                  <View style={styles.formDetectContent}>
                    <Text style={[styles.formDetectLabel, detectedPlaceId && styles.formDetectLabelActive]}>{detectedPlaceId ? 'Location detected' : 'Detect current location'}</Text>
                    <Text style={styles.formDetectSub}>{detectedPlaceId ? 'Place ID captured (hidden). Fill in your custom name below.' : 'GPS place ID will be stored silently'}</Text>
                  </View>
                  <MaterialIcons name={detectedPlaceId ? 'check-circle' : 'chevron-right'} size={18} color={detectedPlaceId ? Colors.primary : Colors.textLight} />
                </TouchableOpacity>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ADDRESS</Text>
                  <TextInput style={styles.input} placeholder="e.g. 42, Awolowo Road" placeholderTextColor={Colors.textMuted} value={formAddress} onChangeText={setFormAddress} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CITY / AREA</Text>
                  <TextInput style={styles.input} placeholder="e.g. Ikeja, Lagos" placeholderTextColor={Colors.textMuted} value={formCity} onChangeText={setFormCity} />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
                  <MaterialIcons name="check" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>{editingId ? 'Update Location' : 'Save Location'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3f0' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },

  /* ─── Header ─── */
  header: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6, zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1, fontWeight: '500' },
  locateBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  addBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  /* ─── Detection Banner ─── */
  detectBanner: {
    flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, marginTop: 8,
    backgroundColor: Colors.primary, borderRadius: 16, padding: 14, gap: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  detectPulse: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  detectPulseRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  detectContent: { flex: 1, gap: 6 },
  detectTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  detectSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  detectInput: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 2 },
  detectActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  detectNoBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  detectNoText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  detectYesBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  detectYesBtnDisabled: { opacity: 0.5 },
  detectYesText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  detectDismiss: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  detectSaving: { gap: 2 },
  detectSavedLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  detectSavedSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  /* ─── Search ─── */
  searchWrap: { paddingHorizontal: 16, paddingVertical: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0, fontWeight: '500' },

  /* ─── Section ─── */
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6 },

  /* ─── Location Card ─── */
  locCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  locCardMain: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  locIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  locInfo: { flex: 1, gap: 1 },
  locLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locLabel: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  locTag: { backgroundColor: Colors.primary + '12', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: Colors.primary + '20' },
  locTagText: { fontSize: 8, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  locAddress: { fontSize: 12, color: Colors.textMedium, fontWeight: '500' },
  locCityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locCity: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  locNavigateBadge: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.primary + '08', alignItems: 'center', justifyContent: 'center' },
  locActions: { flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingBottom: 10, justifyContent: 'flex-end' },
  locActionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },

  /* ─── Empty ─── */
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  emptySub: { fontSize: 13, color: Colors.textLight },

  /* ─── Add Button ─── */
  addLocationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary + '06', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: Colors.primary + '20', borderStyle: 'dashed', marginTop: 4 },
  addLocationText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  /* ─── Form Modal ─── */
  formOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  formPanel: { backgroundColor: '#f8f7f5', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  formHandle: { alignItems: 'center', paddingTop: 8 },
  formHandleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  formTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark },
  formClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  formScroll: { maxHeight: 400 },
  formContent: { padding: 16, gap: 14 },

  formDetectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primary + '06',
    borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.primary + '20', borderStyle: 'dashed',
  },
  formDetectBtnActive: { backgroundColor: Colors.primary + '08', borderColor: Colors.primary + '40', borderStyle: 'solid' },
  formDetectPulse: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center' },
  formDetectPulseActive: { backgroundColor: Colors.primary },
  formDetectContent: { flex: 1, gap: 1 },
  formDetectLabel: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  formDetectLabelActive: { color: Colors.primary },
  formDetectSub: { fontSize: 11, color: Colors.textMedium, fontWeight: '500' },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMedium, letterSpacing: 0.6 },
  input: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textDark, borderWidth: 1, borderColor: Colors.outlineVariant, fontWeight: '500' },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
  typeChipTextActive: { color: '#fff' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, marginTop: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
