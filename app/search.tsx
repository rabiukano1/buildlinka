import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Image, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Colors } from '../constants/Colors';
import { formatPrice, goBackOrHome, type BackendProduct } from '../lib/backend';
import { useCart } from '../contexts/CartContext';
import { usePermissions } from '../hooks/usePermissions';
import { imageSearchAvailable, searchByImage } from '../lib/imageSearch';
import { Image as ExpoImage } from 'expo-image';

// Static browse links for the routes that exist (no catalogue data involved).
const BROWSE = [
  { name: 'Cement', slug: 'cement', icon: 'foundation' },
  { name: 'Steel & Iron', slug: 'steel-iron', icon: 'construction' },
  { name: 'Roofing', slug: 'roofing', icon: 'roofing' },
  { name: 'Electrical', slug: 'electrical', icon: 'bolt' },
  { name: 'Plumbing', slug: 'plumbing', icon: 'plumbing' },
  { name: 'Tiles', slug: 'tiles', icon: 'grid-view' },
  { name: 'Paint', slug: 'paint', icon: 'format-paint' },
  { name: 'Blocks', slug: 'blocks', icon: 'view-module' },
];

// Kept for the app session; moves to storage/backend later.
let recentSearches: string[] = [];

/** QR "buildlinka://product/<id>" (or any link with /product/<id>) → product id. */
function resolveProductLink(data: string): string | null {
  return data.match(/product\/([\w-]+)/)?.[1] ?? null;
}

type PhotoSearch = { uri: string; status: 'searching' | 'done' | 'unavailable' | 'error' };

function ProductRow({ product, onPress, onAdd }: { product: BackendProduct; onPress: () => void; onAdd: () => void }) {
  const out = product.stock <= 0;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        {product.photoUrls[0]
          ? <ExpoImage source={{ uri: product.photoUrls[0] }} style={{ width: 52, height: 52, borderRadius: 8 }} contentFit="cover" />
          : <Text style={styles.thumbEmoji}>📦</Text>}
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{product.storeName}</Text>
        <Text style={styles.rowPrice}>{formatPrice(product.price)}<Text style={styles.rowUnit}> /{product.unit}</Text></Text>
      </View>
      <TouchableOpacity style={[styles.addBtn, out && styles.addBtnOff]} onPress={onAdd} disabled={out} accessibilityLabel={`Add ${product.name} to cart`}>
        <MaterialIcons name={out ? 'remove-shopping-cart' : 'add-shopping-cart'} size={18} color={out ? Colors.outline : Colors.onSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { addItem } = useCart();
  const { ensure } = usePermissions();
  const [camPermission, requestCam] = useCameraPermissions();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState(recentSearches);
  const [scanning, setScanning] = useState(false);
  const [torch, setTorch] = useState(false);
  const [photo, setPhoto] = useState<PhotoSearch | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const scanLock = useRef(false);

  const q = query.trim();
  const serverRows = useQuery(api.products.list, { search: q || undefined });
  const barcodeHit = useQuery(api.products.byBarcode, pendingCode ? { code: pendingCode } : 'skip');
  // Text typed → server results; empty box → the browse view below.
  const results = q ? serverRows : null;

  const remember = (term: string) => {
    const t = term.trim();
    if (!t) return;
    recentSearches = [t, ...recentSearches.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    setRecent(recentSearches);
  };

  const openProduct = (id: string) => {
    remember(query);
    router.push(`/product/${id}` as any);
  };

  const openScanner = async () => {
    const granted = camPermission?.granted || (await requestCam()).granted;
    if (!granted) {
      Alert.alert('Camera needed', 'Allow camera access to scan barcodes.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    scanLock.current = false;
    setScanning(true);
  };

  // Barcode lookup resolves asynchronously against the backend.
  useEffect(() => {
    if (pendingCode === null || barcodeHit === undefined) return;
    const code = pendingCode;
    setPendingCode(null);
    if (barcodeHit) {
      router.push(`/product/${barcodeHit}` as any);
    } else {
      Alert.alert('No match yet', `We couldn't find a product for code ${code}.`, [
        { text: 'Scan again', onPress: () => { openScanner(); } },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }, [pendingCode, barcodeHit]);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setScanning(false);
    setTorch(false);
    const linkId = resolveProductLink(data);
    if (linkId) {
      router.push(`/product/${linkId}` as any);
    } else {
      setPendingCode(data.trim());
    }
  };

  const runPhotoSearch = async (source: 'camera' | 'gallery') => {
    if (!(await ensure(source === 'camera' ? 'camera' : 'mediaLibrary'))) return;
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true };
    const picked = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;
    const uri = picked.assets[0].uri;
    if (!imageSearchAvailable) {
      setPhoto({ uri, status: 'unavailable' });
      return;
    }
    setPhoto({ uri, status: 'searching' });
    try {
      await searchByImage(uri);
      setPhoto({ uri, status: 'done' });
    } catch {
      setPhoto({ uri, status: 'error' });
    }
  };

  const askPhotoSource = () =>
    Alert.alert('Search by photo', 'Take a picture of the material or pick one from your gallery.', [
      { text: 'Camera', onPress: () => runPhotoSearch('camera') },
      { text: 'Gallery', onPress: () => runPhotoSearch('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  useEffect(() => {
    if (params.mode === 'scan') openScanner();
    else if (params.mode === 'image') askPhotoSource();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => goBackOrHome()} hitSlop={6} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search cement, rods, tiles…"
            placeholderTextColor={Colors.outline}
            value={query}
            onChangeText={(t) => { setQuery(t); setPhoto(null); }}
            onSubmitEditing={() => remember(query)}
            returnKeyType="search"
            autoFocus={!params.mode}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <MaterialIcons name="close" size={18} color={Colors.outline} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={openScanner} hitSlop={6} accessibilityLabel="Scan barcode">
                <MaterialIcons name="qr-code-scanner" size={22} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={askPhotoSource} hitSlop={6} accessibilityLabel="Search by photo">
                <MaterialIcons name="photo-camera" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {photo && (
          <View style={styles.photoCard}>
            <View style={styles.photoHead}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <View style={styles.flex}>
                <Text style={styles.photoTitle}>
                  {photo.status === 'searching' ? 'Looking for matches…' : 'Photo search'}
                </Text>
                <Text style={styles.photoSub}>
                  {photo.status === 'unavailable'
                    ? "Photo matching isn't switched on yet. Tell us what it is:"
                    : photo.status === 'error'
                      ? "Couldn't reach photo search. Try again or pick a category:"
                      : 'Photo matching against the live catalogue is coming soon. Pick a category:'}
                </Text>
              </View>
              {photo.status === 'searching' ? <ActivityIndicator color={Colors.primary} /> : (
                <TouchableOpacity onPress={() => setPhoto(null)} hitSlop={8} accessibilityLabel="Close photo search">
                  <MaterialIcons name="close" size={20} color={Colors.outline} />
                </TouchableOpacity>
              )}
            </View>
            {photo.status !== 'searching' && (
              <View style={styles.chips}>
                {BROWSE.map((c) => (
                  <TouchableOpacity key={c.slug} style={styles.chip} onPress={() => router.push(`/category/${c.slug}` as any)}>
                    <MaterialIcons name={c.icon as any} size={16} color={Colors.onSurfaceVariant} />
                    <Text style={styles.chipText}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {!results ? (
          <>
            <View style={styles.tools}>
              <TouchableOpacity style={styles.tool} onPress={openScanner} activeOpacity={0.8}>
                <View style={styles.toolIcon}>
                  <MaterialIcons name="qr-code-scanner" size={26} color={Colors.onPrimary} />
                </View>
                <Text style={styles.toolTitle}>Scan barcode</Text>
                <Text style={styles.toolSub}>Point at a pack or QR code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tool} onPress={askPhotoSource} activeOpacity={0.8}>
                <View style={[styles.toolIcon, styles.toolIconOrange]}>
                  <MaterialIcons name="image-search" size={26} color={Colors.onSecondary} />
                </View>
                <Text style={styles.toolTitle}>Search by photo</Text>
                <Text style={styles.toolSub}>Snap a material to find it</Text>
              </TouchableOpacity>
            </View>

            {recent.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <TouchableOpacity onPress={() => { recentSearches = []; setRecent([]); }} hitSlop={8}>
                    <Text style={styles.link}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recent.map((r) => (
                  <TouchableOpacity key={r} style={styles.recentRow} onPress={() => setQuery(r)}>
                    <MaterialIcons name="history" size={20} color={Colors.outline} />
                    <Text style={styles.recentText}>{r}</Text>
                    <MaterialIcons name="north-west" size={18} color={Colors.outline} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={[styles.sectionTitle, styles.sectionGap]}>Browse categories</Text>
            <View style={styles.catGrid}>
              {BROWSE.map((c) => (
                <TouchableOpacity key={c.slug} style={styles.cat} onPress={() => router.push(`/category/${c.slug}` as any)} activeOpacity={0.7}>
                  <View style={styles.catIcon}>
                    <MaterialIcons name={c.icon as any} size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.catText} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : results === undefined ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.emptySub}>Searching materials…</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={40} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No results for “{query.trim()}”</Text>
            <Text style={styles.emptySub}>Check the spelling, or try scanning the barcode instead.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openScanner}>
              <MaterialIcons name="qr-code-scanner" size={18} color={Colors.primary} />
              <Text style={styles.link}>Scan barcode</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Materials · {results.length}</Text>
              <TouchableOpacity onPress={() => { remember(query); router.push({ pathname: '/(tabs)/materials', params: { q: query.trim() } } as any); }} hitSlop={8}>
                <Text style={styles.link}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {results.slice(0, 5).map((p) => <ProductRow key={p._id} product={p} onPress={() => openProduct(p._id)} onAdd={() => addItem(p)} />)}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)} statusBarTranslucent>
        <View style={styles.scanner}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'] }}
            onBarcodeScanned={onScanned}
          />
          <View style={[styles.scanTop, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.scanBtn} onPress={() => setScanning(false)} accessibilityLabel="Close scanner">
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scanTitle}>Scan barcode</Text>
            <TouchableOpacity style={styles.scanBtn} onPress={() => setTorch(!torch)} accessibilityLabel="Toggle flashlight">
              <MaterialIcons name={torch ? 'flash-on' : 'flash-off'} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.scanFrameWrap} pointerEvents="none">
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.scanHint}>Line up the barcode on the bag or box, or a BuildLinka QR code</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: 16 },
  link: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, paddingHorizontal: 14, marginRight: 8, borderRadius: 999, borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.card },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },

  tools: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tool: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: Colors.card, gap: 4, shadowColor: '#1b1c1c', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  toolIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  toolIconOrange: { backgroundColor: Colors.secondary },
  toolTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  toolSub: { fontSize: 13, color: Colors.outline },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  sectionGap: { marginTop: 16 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 },
  recentText: { flex: 1, fontSize: 16, color: Colors.onSurface },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  cat: { width: '25%', alignItems: 'center', gap: 6 },
  catIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.greenTint + '33' },
  catText: { fontSize: 12, fontWeight: '500', color: Colors.onSurface, paddingHorizontal: 2 },

  card: { backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, shadowColor: '#1b1c1c', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.surfaceVariant + '80', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbEmoji: { fontSize: 26 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  rowSub: { fontSize: 13, color: Colors.outline, marginTop: 1 },
  rowPrice: { fontSize: 15, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  rowUnit: { fontSize: 12, fontWeight: '400', color: Colors.outline },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  addBtnOff: { backgroundColor: Colors.surfaceVariant },

  photoCard: { backgroundColor: Colors.card, borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
  photoHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  photo: { width: 64, height: 64, borderRadius: 8, backgroundColor: Colors.surfaceVariant },
  photoTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  photoSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.outline, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },

  scanner: { flex: 1, backgroundColor: '#000' },
  scanTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  scanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  scanFrameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 },
  scanFrame: { width: 260, height: 180 },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  scanHint: { fontSize: 15, color: '#fff', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, overflow: 'hidden' },
});
