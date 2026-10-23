import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../../constants/Colors';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import ProductCard from '../../components/ProductCard';
import KeyboardAwareWrapper from '../../components/KeyboardAwareWrapper';
import { CategoryHeader } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { estimateCement, MIXES } from '../../lib/cementEstimate';

const formatPrice = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

const JOBS = [
  { id: 'slab', label: 'Floor / slab', icon: 'foundation', dims: ['Length (m)', 'Width (m)'], thickness: [100, 125, 150], hint: 'Concrete for floors, slabs and decking' },
  { id: 'screed', label: 'Screed', icon: 'layers', dims: ['Length (m)', 'Width (m)'], thickness: [25, 50, 75], hint: 'Smooth 1:4 topping before tiles' },
  { id: 'plaster', label: 'Plaster', icon: 'format-paint', dims: ['Wall length (m)', 'Wall height (m)'], thickness: [12, 15, 20], hint: '1:6 rendering for walls' },
] as const;
type JobId = (typeof JOBS)[number]['id'];

const CONCRETE_MIXES = [
  { id: 'm15', label: '1:2:4 (M15)', note: 'Floors, blinding' },
  { id: 'm20', label: '1:1.5:3 (M20)', note: 'Slabs, beams, columns' },
] as const;

const TIPS = [
  { icon: 'event', title: 'Check the date', text: 'Use cement within 3 months of the date on the bag. Older cement loses strength.' },
  { icon: 'water-drop', title: 'Keep it dry', text: 'Stack bags on pallets, off the floor and away from walls, under a cover.' },
  { icon: 'grade', title: '42.5R vs 32.5', text: '42.5R sets stronger and faster — best for slabs and columns. 32.5 is fine for blocks and plaster.' },
  { icon: 'scale', title: 'Weigh a bag', text: 'A genuine bag is 50 kg. Underweight bags are a common scam on site.' },
];

// "Dangote Cement 42.5R (50kg)" → "Dangote"
const brandOf = (name: string) => name.split(' ')[0];

export default function CementCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();

  const rows = useQuery(api.products.list, { category: 'Cement' });
  const cementProducts = useMemo(() => [...(rows ?? [])].sort((a, b) => a.price - b.price), [rows]);
  const cheapestId = cementProducts.find((p) => p.stock > 0)?._id;

  const [jobId, setJobId] = useState<JobId>('slab');
  const [mixId, setMixId] = useState<'m15' | 'm20'>('m15');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState<number>(100);
  const [waste, setWaste] = useState(5);
  const [productId, setProductId] = useState<string | null>(null);
  const [openTip, setOpenTip] = useState<number | null>(0);

  const job = JOBS.find((j) => j.id === jobId)!;
  const product = cementProducts.find((p) => p._id === productId) ?? cementProducts[0];
  const mix = jobId === 'slab' ? MIXES[mixId] : MIXES[jobId];
  const estimate = estimateCement(parseFloat(length), parseFloat(width), thickness, mix, waste);

  const pickJob = (id: JobId) => {
    setJobId(id);
    setThickness(JOBS.find((j) => j.id === id)!.thickness[1]);
  };

  const addEstimate = () => {
    if (!estimate || !product) return;
    addItem(product, estimate.bags);
    Alert.alert('Added to cart', `${estimate.bags} bags of ${product.name}`, [
      { text: 'Keep browsing', style: 'cancel' },
      { text: 'View cart', onPress: () => router.push('/cart' as any) },
    ]);
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareWrapper contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <CategoryHeader title='Cement Supply' emoji='🏗️' heroTitle='Order the right number of bags' heroSub='Estimate cement, sand and gravel for your job, compare brands, then order.' trust={[['verified', 'Genuine 50 kg'], ['local-shipping', 'Site delivery'], ['savings', 'Best price']]} />

        <Text style={styles.sectionTitle}>Compare brands</Text>
        {rows === undefined && <ActivityIndicator size="large" color={Colors.primary} />}
        {cementProducts.map((p) => {
          const active = p._id === product?._id;
          return (
            <TouchableOpacity key={p._id} style={[styles.brandCard, active && styles.brandCardActive]} onPress={() => setProductId(p._id)} activeOpacity={0.8} accessibilityState={{ selected: active }}>
              <View style={styles.brandLogo}>
                <Text style={styles.brandInitial}>{brandOf(p.name)[0]}</Text>
              </View>
              <View style={styles.flex}>
                <View style={styles.brandNameRow}>
                  <Text style={styles.brandName}>{brandOf(p.name)}</Text>
                  {p._id === cheapestId && cementProducts.length > 1 && (
                    <View style={styles.cheapest}>
                      <Text style={styles.cheapestText}>Lowest price</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.brandSub} numberOfLines={1}>{p.name.replace(brandOf(p.name) + ' ', '')}</Text>
                <Text style={styles.brandMeta}>{p.storeName}{p.storeVerified ? ' · Verified' : ''}</Text>
              </View>
              <View style={styles.brandRight}>
                <Text style={styles.brandPrice}>{formatPrice(p.price)}</Text>
                <Text style={styles.brandUnit}>per bag</Text>
                <MaterialIcons name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={22} color={active ? Colors.primary : Colors.outlineVariant} />
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Bag estimator</Text>
        <View style={styles.card}>
          <View style={styles.jobRow}>
            {JOBS.map((j) => {
              const active = j.id === jobId;
              return (
                <TouchableOpacity key={j.id} style={[styles.job, active && styles.jobActive]} onPress={() => pickJob(j.id)} activeOpacity={0.7}>
                  <MaterialIcons name={j.icon as any} size={24} color={active ? Colors.primary : Colors.onSurfaceVariant} />
                  <Text style={[styles.jobText, active && styles.jobTextActive]}>{j.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.jobHint}>{job.hint}</Text>

          {jobId === 'slab' && (
            <>
              <Text style={styles.label}>Mix</Text>
              <View style={styles.wrap}>
                {CONCRETE_MIXES.map((m) => <Chip key={m.id} label={m.label} active={mixId === m.id} onPress={() => setMixId(m.id)} />)}
              </View>
              <Text style={styles.mixNote}>{CONCRETE_MIXES.find((m) => m.id === mixId)!.note}</Text>
            </>
          )}

          <View style={styles.split}>
            <View style={styles.flex}>
              <Field label={job.dims[0]} placeholder="10" keyboardType="decimal-pad" value={length} onChangeText={(t) => setLength(t.replace(/[^0-9.]/g, ''))} />
            </View>
            <View style={styles.flex}>
              <Field label={job.dims[1]} placeholder={jobId === 'plaster' ? '3' : '8'} keyboardType="decimal-pad" value={width} onChangeText={(t) => setWidth(t.replace(/[^0-9.]/g, ''))} />
            </View>
          </View>

          <Text style={styles.label}>Thickness</Text>
          <View style={styles.wrap}>
            {job.thickness.map((t) => <Chip key={t} label={`${t} mm`} active={thickness === t} onPress={() => setThickness(t)} />)}
          </View>
          <Text style={styles.label}>Extra for spillage</Text>
          <View style={[styles.wrap, styles.noMargin]}>
            {[0, 5, 10].map((w) => <Chip key={w} label={`${w}%`} active={waste === w} onPress={() => setWaste(w)} />)}
          </View>

          {estimate ? (
            <View style={styles.result}>
              <Text style={styles.resultLabel}>You need about</Text>
              <Text style={styles.resultBig}>{estimate.bags.toLocaleString('en-NG')} <Text style={styles.resultUnit}>bags of cement</Text></Text>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{estimate.volume.toFixed(2)} m³</Text>
                  <Text style={styles.metricLabel}>{jobId === 'slab' ? 'Concrete' : 'Mortar'}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{estimate.sandT.toFixed(1)} t</Text>
                  <Text style={styles.metricLabel}>Sharp sand</Text>
                </View>
                {estimate.gravelT > 0 && (
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{estimate.gravelT.toFixed(1)} t</Text>
                    <Text style={styles.metricLabel}>Granite (¾″)</Text>
                  </View>
                )}
              </View>
              {product && (
                <>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>{brandOf(product.name)} at {formatPrice(product.price)}/bag</Text>
                    <Text style={styles.cost}>{formatPrice(product.price * estimate.bags)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.cta, product.stock <= 0 && styles.ctaOff]} onPress={addEstimate} disabled={product.stock <= 0} activeOpacity={0.8}>
                    <MaterialIcons name="add-shopping-cart" size={20} color={Colors.onSecondary} />
                    <Text style={styles.ctaText}>{product.stock > 0 ? `Add ${estimate.bags} bags to cart` : 'Out of stock'}</Text>
                  </TouchableOpacity>
                </>
              )}
              <Text style={styles.footnote}>Standard dry-volume method, 50 kg bags. Sand and granite are bought separately — ask your vendor for tipper prices.</Text>
            </View>
          ) : (
            <View style={styles.resultEmpty}>
              <MaterialIcons name="straighten" size={22} color={Colors.outline} />
              <Text style={styles.resultEmptyText}>Enter the size of the area to see how many bags you need.</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Buying tips</Text>
        <View style={[styles.card, styles.tips]}>
          {TIPS.map((t, i) => {
            const open = openTip === i;
            return (
              <TouchableOpacity key={t.title} style={[styles.tip, i > 0 && styles.tipDivider]} onPress={() => setOpenTip(open ? null : i)} activeOpacity={0.7}>
                <View style={styles.tipHead}>
                  <MaterialIcons name={t.icon as any} size={20} color={Colors.primary} />
                  <Text style={styles.tipTitle}>{t.title}</Text>
                  <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={Colors.outline} />
                </View>
                {open && <Text style={styles.tipText}>{t.text}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionGap]}>All cement</Text>
        {cementProducts.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            horizontal
            onPress={() => router.push(`/product/${p._id}`)}
            onAddToCart={() => addItem(p)}
            onToggleSave={() => toggleSave(p)}
            isSaved={isSaved(p._id)}
          />
        ))}

        <TouchableOpacity style={styles.installer} onPress={() => router.push('/(tabs)/workers' as any)} activeOpacity={0.85}>
          <View style={styles.installerIcon}>
            <MaterialIcons name="engineering" size={26} color={Colors.onPrimary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.installerTitle}>Need a mason?</Text>
            <Text style={styles.installerSub}>Hire a vetted mason for casting, screeding or plastering</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>
      </KeyboardAwareWrapper>
    </View>
  );
}

const shadow = { shadowColor: '#1b1c1c', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  flex: { flex: 1 },
  noMargin: { marginBottom: 0 },


  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface, marginBottom: 12 },
  sectionGap: { marginTop: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 12, ...shadow },
  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  split: { flexDirection: 'row', gap: 12 },

  brandCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.divider, marginBottom: 8, ...shadow },
  brandCardActive: { borderColor: Colors.primary, borderWidth: 2, padding: 11 },
  brandLogo: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandInitial: { fontSize: 22, fontWeight: '700', color: Colors.onPrimary },
  brandNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  cheapest: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: Colors.orangeTint },
  cheapestText: { fontSize: 11, fontWeight: '700', color: Colors.secondary },
  brandSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 1 },
  brandMeta: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  brandRight: { alignItems: 'flex-end', gap: 2 },
  brandPrice: { fontSize: 17, fontWeight: '700', color: Colors.onSurface },
  brandUnit: { fontSize: 11, color: Colors.outline },

  jobRow: { flexDirection: 'row', gap: 8 },
  job: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  jobActive: { borderColor: Colors.primary, borderWidth: 2, paddingVertical: 11, backgroundColor: Colors.greenTint + '4d' },
  jobText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  jobTextActive: { color: Colors.primary },
  jobHint: { fontSize: 13, color: Colors.outline, marginTop: 8, marginBottom: 16 },
  mixNote: { fontSize: 12, color: Colors.outline, marginTop: -8, marginBottom: 16 },

  result: { marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
  resultLabel: { fontSize: 14, color: Colors.onSurfaceVariant },
  resultBig: { fontSize: 36, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  resultUnit: { fontSize: 16, fontWeight: '600', color: Colors.onSurfaceVariant },
  metrics: { flexDirection: 'row', marginTop: 12 },
  metric: { flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  metricLabel: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  costLabel: { fontSize: 14, color: Colors.onSurfaceVariant, flex: 1 },
  cost: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 12 },
  ctaOff: { backgroundColor: Colors.outlineVariant },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
  footnote: { fontSize: 12, color: Colors.outline, marginTop: 12, lineHeight: 16 },
  resultEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background },
  resultEmptyText: { flex: 1, fontSize: 14, color: Colors.onSurfaceVariant },

  tips: { paddingVertical: 4 },
  tip: { paddingVertical: 12 },
  tipDivider: { borderTopWidth: 1, borderTopColor: Colors.divider },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  tipText: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, marginTop: 8, marginLeft: 32 },

  installer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 8, backgroundColor: Colors.primary, marginTop: 12 },
  installerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  installerTitle: { fontSize: 16, fontWeight: '600', color: Colors.onPrimary },
  installerSub: { fontSize: 13, color: Colors.greenTint, marginTop: 2 },
});
