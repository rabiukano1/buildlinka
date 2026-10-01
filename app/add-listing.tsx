import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Colors } from '../constants/Colors';
import { usePermissions } from '../hooks/usePermissions';

const MAX_IMAGES = 6;
const MAX_TITLE = 80;
const MAX_DESC = 500;
const PLATFORM_FEE = 0.1;

const CATEGORIES = ['Cement', 'Steel & Iron', 'Roofing', 'Electrical', 'Plumbing', 'Tiles', 'Timber', 'Glass', 'Paint', 'Blocks', 'Equipment'];
const UNITS = ['piece', 'bag', 'box', 'sheet', 'bucket', 'block', 'meter', 'litre', 'kg', 'pack'];

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint && <Text style={styles.sectionHint}>{hint}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Chips({ options, value, onSelect, scroll }: { options: string[]; value: string; onSelect: (v: string) => void; scroll?: boolean }) {
  const chips = options.map((opt) => {
    const active = value === opt;
    return (
      <TouchableOpacity key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => onSelect(opt)} activeOpacity={0.7}>
        {active && <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />}
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
      </TouchableOpacity>
    );
  });
  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{chips}</ScrollView>
  ) : (
    <View style={styles.chipWrap}>{chips}</View>
  );
}

export default function AddListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ensure } = usePermissions();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const priceNum = Number(price) || 0;
  const qtyNum = Number(quantity) || 0;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!images.length) e.photos = 'Add at least one photo';
    if (!title.trim()) e.title = 'Title is required';
    if (!category) e.category = 'Pick a category';
    if (priceNum <= 0) e.price = 'Enter a price';
    if (qtyNum <= 0) e.quantity = 'Enter stock quantity';
    if (!unit) e.unit = 'Pick a unit';
    return e;
  }, [images.length, title, category, priceNum, qtyNum, unit]);

  const missing = Object.keys(errors).length;
  const progress = (6 - missing) / 6;
  const err = (key: string) => (showErrors ? errors[key] : undefined);

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (!(await ensure(source === 'camera' ? 'camera' : 'mediaLibrary'))) return;
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ ...options, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: MAX_IMAGES - images.length });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
  };

  const makeCover = (idx: number) => setImages((prev) => [prev[idx], ...prev.filter((_, i) => i !== idx)]);
  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const stepQty = (d: number) => setQuantity(String(Math.max(0, qtyNum + d)));

  const handlePublish = () => {
    if (missing) {
      setShowErrors(true);
      Alert.alert('Almost there', `Complete these first:\n• ${Object.values(errors).join('\n• ')}`);
      return;
    }
    Alert.alert(
      'Listing submitted',
      "Your listing is pending review. We'll notify you once it's live.",
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const inputStyle = (key: string) => [styles.input, focused === key && styles.inputFocused, err(key) && styles.inputError];
  const focusProps = (key: string) => ({ onFocus: () => setFocused(key), onBlur: () => setFocused(null) });

  const footer = (
    <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
      <View style={styles.footerStatus}>
        <Text style={styles.footerCount}>{missing ? `${missing} left` : 'Ready'}</Text>
        <Text style={styles.footerSub}>{missing ? 'to complete' : 'to publish'}</Text>
      </View>
      <TouchableOpacity style={[styles.publishBtn, !!missing && styles.publishBtnIdle]} onPress={handlePublish} activeOpacity={0.8}>
        <Text style={styles.publishText}>Publish listing</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'New Listing', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background } }} />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <KeyboardAwareWrapper contentContainerStyle={styles.content} footer={footer}>
        <Section title="Photos" hint={`Clear photos sell up to 3x faster · ${images.length}/${MAX_IMAGES}`}>
          {images.length ? (
            <View style={styles.cover}>
              <Image source={{ uri: images[0] }} style={styles.coverImg} />
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>Cover</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(0)} hitSlop={10}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.dropzone, err('photos') && styles.dropzoneError]}>
              <Ionicons name="images-outline" size={36} color={Colors.primary} />
              <Text style={styles.dropzoneTitle}>Show buyers what you're selling</Text>
              <Text style={styles.dropzoneSub}>Use good light and show the brand label</Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
            {images.slice(1).map((uri, i) => (
              <TouchableOpacity key={uri} style={styles.thumb} onPress={() => makeCover(i + 1)} activeOpacity={0.8}>
                <Image source={{ uri }} style={styles.thumbImg} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(i + 1)} hitSlop={8}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {images.length < MAX_IMAGES && (
              <>
                <TouchableOpacity style={styles.addTile} onPress={() => pickImage('camera')} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                  <Text style={styles.addTileText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addTile} onPress={() => pickImage('gallery')} activeOpacity={0.7}>
                  <Ionicons name="image-outline" size={22} color={Colors.primary} />
                  <Text style={styles.addTileText}>Gallery</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
          {images.length > 1 && <Text style={styles.helper}>Tap a photo to make it the cover</Text>}
          {err('photos') && <Text style={styles.errorText}>{err('photos')}</Text>}
        </Section>

        <Section title="Details">
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={inputStyle('title')}
            placeholder="e.g. Dangote Cement 42.5R – 50kg"
            placeholderTextColor={Colors.outline}
            value={title}
            onChangeText={setTitle}
            maxLength={MAX_TITLE}
            {...focusProps('title')}
          />
          <View style={styles.metaRow}>
            <Text style={styles.errorText}>{err('title') ?? ''}</Text>
            <Text style={styles.counter}>{title.length}/{MAX_TITLE}</Text>
          </View>

          <Text style={styles.label}>Category</Text>
          <Chips options={CATEGORIES} value={category} onSelect={setCategory} />
          {err('category') && <Text style={styles.errorText}>{err('category')}</Text>}

          <Text style={[styles.label, styles.labelGap]}>Description <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[...inputStyle('description'), styles.textArea]}
            placeholder="Grade, brand, size, delivery options…"
            placeholderTextColor={Colors.outline}
            value={description}
            onChangeText={setDescription}
            maxLength={MAX_DESC}
            multiline
            {...focusProps('description')}
          />
          <Text style={[styles.counter, styles.counterRight]}>{description.length}/{MAX_DESC}</Text>
        </Section>

        <Section title="Price & stock">
          <Text style={styles.label}>Price per {unit || 'unit'}</Text>
          <View style={[styles.priceBox, focused === 'price' && styles.inputFocused, err('price') && styles.inputError]}>
            <Text style={styles.priceSymbol}>₦</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor={Colors.outline}
              value={priceNum ? priceNum.toLocaleString('en-NG') : ''}
              onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              {...focusProps('price')}
            />
          </View>
          {err('price') && <Text style={styles.errorText}>{err('price')}</Text>}

          <Text style={[styles.label, styles.labelGap]}>Sold per</Text>
          <Chips options={UNITS} value={unit} onSelect={setUnit} scroll />
          {err('unit') && <Text style={styles.errorText}>{err('unit')}</Text>}

          <Text style={[styles.label, styles.labelGap]}>Quantity in stock</Text>
          <View style={[styles.stepper, err('quantity') && styles.inputError]}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepQty(-1)} disabled={qtyNum <= 0}>
              <Ionicons name="remove" size={20} color={qtyNum <= 0 ? Colors.outlineVariant : Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.stepInput}
              placeholder="0"
              placeholderTextColor={Colors.outline}
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepQty(1)}>
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {err('quantity') && <Text style={styles.errorText}>{err('quantity')}</Text>}
        </Section>

        {priceNum > 0 && (
          <View style={styles.earnCard}>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>You receive per {unit || 'unit'}</Text>
              <Text style={styles.earnValue}>{naira(Math.round(priceNum * (1 - PLATFORM_FEE)))}</Text>
            </View>
            {qtyNum > 0 && (
              <View style={styles.earnRow}>
                <Text style={styles.earnLabel}>If all {qtyNum.toLocaleString('en-NG')} sell</Text>
                <Text style={styles.earnTotal}>{naira(Math.round(priceNum * qtyNum * (1 - PLATFORM_FEE)))}</Text>
              </View>
            )}
            <Text style={styles.earnFoot}>After {PLATFORM_FEE * 100}% BuildLinka service fee</Text>
          </View>
        )}

        <Text style={styles.terms}>By publishing, you agree to BuildLinka's Terms of Service and Listing Policies.</Text>
      </KeyboardAwareWrapper>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },

  progressTrack: { height: 4, backgroundColor: Colors.surfaceVariant },
  progressFill: { height: 4, backgroundColor: Colors.primary },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface, lineHeight: 28 },
  sectionHint: { fontSize: 14, color: Colors.outline, lineHeight: 20, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  dropzone: {
    height: 168,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dropzoneError: { borderColor: Colors.error },
  dropzoneTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface, marginTop: 8 },
  dropzoneSub: { fontSize: 12, color: Colors.outline },
  cover: { height: 200, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.surfaceVariant },
  coverImg: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  coverBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.onPrimary },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRow: { gap: 8, paddingTop: 12 },
  thumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.surfaceVariant },
  thumbImg: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.greenTint + '66',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addTileText: { fontSize: 12, fontWeight: '500', color: Colors.primary },
  helper: { fontSize: 12, color: Colors.outline, marginTop: 8 },

  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, letterSpacing: 0.14, marginBottom: 8 },
  labelGap: { marginTop: 16 },
  optional: { fontWeight: '400', color: Colors.outline },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.onSurface,
  },
  inputFocused: { borderColor: Colors.primary, borderWidth: 2 },
  inputError: { borderColor: Colors.error },
  textArea: { minHeight: 112, textAlignVertical: 'top' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  counter: { fontSize: 12, color: Colors.outline, marginTop: 4 },
  counterRight: { textAlign: 'right' },
  errorText: { fontSize: 12, fontWeight: '500', color: Colors.error, marginTop: 4 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRow: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceVariant + '99',
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary, fontWeight: '600' },

  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 12,
  },
  priceSymbol: { fontSize: 24, fontWeight: '700', color: Colors.onSurface, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.onSurface, paddingVertical: 12 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  stepBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepInput: { minWidth: 72, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.onSurface, paddingVertical: 8 },

  earnCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    padding: 16,
    marginBottom: 24,
    gap: 8,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earnLabel: { fontSize: 14, color: Colors.onSurfaceVariant },
  earnValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  earnTotal: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  earnFoot: { fontSize: 12, color: Colors.outline },

  terms: { fontSize: 12, color: Colors.outline, textAlign: 'center', lineHeight: 16, paddingHorizontal: 24 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerStatus: { flex: 1 },
  footerCount: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  footerSub: { fontSize: 12, color: Colors.outline },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  publishBtnIdle: { opacity: 0.6 },
  publishText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
});
