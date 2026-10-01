import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS, VENDORS } from '../../constants/MockData';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import ProductCard from '../../components/ProductCard';
import KeyboardAwareWrapper from '../../components/KeyboardAwareWrapper';
import { CategoryHeader } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { estimateRoof, type RoofStyle } from '../../lib/roofEstimate';

const formatPrice = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

// Typical figures; coverage is the effective area one sheet/tile covers after side and end laps.
const SHEET_TYPES = [
  { id: 'aluminium', label: 'Aluminium long-span', short: 'Aluminium', icon: 'view-stream', coverage: 1.8, fixingsPerM2: 6, productId: 'p3', lifespan: '30–40 yrs', noise: 'Loud in rain', heat: 'Reflects heat', cost: 2 },
  { id: 'stone', label: 'Stone-coated tile', short: 'Stone-coated', icon: 'texture', coverage: 0.48, fixingsPerM2: 10, productId: null, lifespan: '50+ yrs', noise: 'Quiet', heat: 'Well insulated', cost: 3 },
  { id: 'pvc', label: 'PVC / polycarbonate', short: 'PVC', icon: 'wb-sunny', coverage: 1.7, fixingsPerM2: 6, productId: null, lifespan: '10–20 yrs', noise: 'Medium', heat: 'Lets light in', cost: 1 },
] as const;

const STYLES: { id: RoofStyle; label: string; icon: string }[] = [
  { id: 'gable', label: 'Gable', icon: 'change-history' },
  { id: 'hip', label: 'Hip', icon: 'roofing' },
  { id: 'flat', label: 'Lean-to', icon: 'trending-flat' },
];
const PITCHES = [{ deg: 15, label: 'Low 15°' }, { deg: 25, label: 'Standard 25°' }, { deg: 35, label: 'Steep 35°' }];
const OVERHANGS = [0.3, 0.6, 0.9];
const WASTES = [5, 10, 15];

export default function RoofingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();

  const [typeId, setTypeId] = useState<(typeof SHEET_TYPES)[number]['id']>('aluminium');
  const [style, setStyle] = useState<RoofStyle>('gable');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [pitch, setPitch] = useState(25);
  const [overhang, setOverhang] = useState(0.6);
  const [waste, setWaste] = useState(10);

  const type = SHEET_TYPES.find((t) => t.id === typeId)!;
  const product = type.productId ? PRODUCTS.find((p) => p.id === type.productId) : undefined;
  const roofingProducts = PRODUCTS.filter((p) => p.category === 'Roofing');
  const vendor = VENDORS.find((v) => v.category === 'Roofing');

  const estimate = useMemo(
    () => estimateRoof({
      length: parseFloat(length),
      width: parseFloat(width),
      style,
      pitchDeg: style === 'flat' ? 5 : pitch,
      overhang,
      wastePct: waste,
      coverage: type.coverage,
      fixingsPerM2: type.fixingsPerM2,
    }),
    [length, width, style, pitch, overhang, waste, type]
  );

  const addEstimateToCart = () => {
    if (!estimate || !product) return;
    addItem(product, estimate.sheets);
    Alert.alert('Added to cart', `${estimate.sheets} × ${product.name}`, [
      { text: 'Keep browsing', style: 'cancel' },
      { text: 'View cart', onPress: () => router.push('/cart' as any) },
    ]);
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareWrapper contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <CategoryHeader title='Roofing' emoji='🏠' heroTitle='Roof it right, first time' heroSub='Work out exactly how many sheets you need, then order in one tap.' trust={[['verified', 'Weatherproof'], ['local-shipping', 'Nationwide'], ['engineering', 'Installers']]} />

        <Text style={styles.sectionTitle}>Roof estimator</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Roofing type</Text>
          <View style={styles.wrap}>
            {SHEET_TYPES.map((t) => <Chip key={t.id} label={t.short} icon={t.icon} active={typeId === t.id} onPress={() => setTypeId(t.id)} />)}
          </View>

          <Text style={styles.label}>Roof shape</Text>
          <View style={styles.styleRow}>
            {STYLES.map((s) => {
              const active = style === s.id;
              return (
                <TouchableOpacity key={s.id} style={[styles.styleCard, active && styles.styleCardActive]} onPress={() => setStyle(s.id)} activeOpacity={0.7}>
                  <MaterialIcons name={s.icon as any} size={26} color={active ? Colors.primary : Colors.onSurfaceVariant} />
                  <Text style={[styles.styleText, active && styles.styleTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.split}>
            <View style={styles.flex}>
              <Field label="Building length (m)" placeholder="12" keyboardType="decimal-pad" value={length} onChangeText={(t) => setLength(t.replace(/[^0-9.]/g, ''))} />
            </View>
            <View style={styles.flex}>
              <Field label="Building width (m)" placeholder="10" keyboardType="decimal-pad" value={width} onChangeText={(t) => setWidth(t.replace(/[^0-9.]/g, ''))} />
            </View>
          </View>

          {style !== 'flat' && (
            <>
              <Text style={styles.label}>Pitch</Text>
              <View style={styles.wrap}>
                {PITCHES.map((p) => <Chip key={p.deg} label={p.label} active={pitch === p.deg} onPress={() => setPitch(p.deg)} />)}
              </View>
            </>
          )}

          <View style={styles.split}>
            <View style={styles.flex}>
              <Text style={styles.label}>Overhang</Text>
              <View style={styles.wrap}>
                {OVERHANGS.map((o) => <Chip key={o} label={`${o} m`} active={overhang === o} onPress={() => setOverhang(o)} />)}
              </View>
            </View>
          </View>
          <Text style={styles.label}>Extra for cuts & waste</Text>
          <View style={[styles.wrap, styles.noMargin]}>
            {WASTES.map((w) => <Chip key={w} label={`${w}%`} active={waste === w} onPress={() => setWaste(w)} />)}
          </View>

          {estimate ? (
            <View style={styles.result}>
              <Text style={styles.resultLabel}>You need about</Text>
              <Text style={styles.resultBig}>
                {estimate.sheets.toLocaleString('en-NG')} <Text style={styles.resultUnit}>{type.id === 'stone' ? 'tiles' : 'sheets'}</Text>
              </Text>
              <View style={styles.metrics}>
                {[
                  ['Roof area', `${estimate.area.toFixed(1)} m²`],
                  ['Ridge & hip caps', estimate.ridge ? `${estimate.ridge.toFixed(1)} m` : '—'],
                  [type.id === 'stone' ? 'Nails' : 'Screws', estimate.fixings.toLocaleString('en-NG')],
                  ['Roof rise', `${estimate.rise.toFixed(2)} m`],
                ].map(([k, v]) => (
                  <View key={k} style={styles.metric}>
                    <Text style={styles.metricValue}>{v}</Text>
                    <Text style={styles.metricLabel}>{k}</Text>
                  </View>
                ))}
              </View>

              {product ? (
                <>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Sheets at {formatPrice(product.price)} each</Text>
                    <Text style={styles.cost}>{formatPrice(product.price * estimate.sheets)}</Text>
                  </View>
                  <TouchableOpacity style={styles.cta} onPress={addEstimateToCart} activeOpacity={0.8}>
                    <MaterialIcons name="add-shopping-cart" size={20} color={Colors.onSecondary} />
                    <Text style={styles.ctaText}>Add {estimate.sheets} sheets to cart</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.notice}>
                  <MaterialIcons name="info-outline" size={18} color={Colors.tertiary} />
                  <Text style={styles.noticeText}>{type.label} isn't sold on BuildLinka yet. Share this estimate with a roofer or vendor for a quote.</Text>
                </View>
              )}
              <Text style={styles.footnote}>
                Assumes each {type.id === 'stone' ? 'tile' : 'sheet'} covers {type.coverage} m² after overlaps. Ask your roofer to confirm before ordering.
              </Text>
            </View>
          ) : (
            <View style={styles.resultEmpty}>
              <MaterialIcons name="straighten" size={22} color={Colors.outline} />
              <Text style={styles.resultEmptyText}>Enter the building's length and width to see your estimate.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Which roof suits you?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareRow}>
          {SHEET_TYPES.map((t) => {
            const active = typeId === t.id;
            return (
              <TouchableOpacity key={t.id} style={[styles.compareCard, active && styles.compareCardActive]} onPress={() => setTypeId(t.id)} activeOpacity={0.8}>
                <View style={styles.compareHead}>
                  <MaterialIcons name={t.icon as any} size={22} color={Colors.primary} />
                  <Text style={styles.costLevel}>{'₦'.repeat(t.cost)}<Text style={styles.costLevelOff}>{'₦'.repeat(3 - t.cost)}</Text></Text>
                </View>
                <Text style={styles.compareTitle}>{t.label}</Text>
                {[['schedule', t.lifespan], ['volume-up', t.noise], ['thermostat', t.heat]].map(([icon, text]) => (
                  <View key={icon} style={styles.compareLine}>
                    <MaterialIcons name={icon as any} size={16} color={Colors.outline} />
                    <Text style={styles.compareText}>{text}</Text>
                  </View>
                ))}
                <Text style={[styles.compareUse, active && styles.compareUseActive]}>{active ? '✓ Using in estimate' : 'Use in estimate'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Roofing products</Text>
        {roofingProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            horizontal
            onPress={() => router.push(`/product/${p.id}`)}
            onAddToCart={() => addItem(p)}
            onToggleSave={() => toggleSave(p)}
            isSaved={isSaved(p.id)}
          />
        ))}

        {vendor && (
          <View style={[styles.card, styles.vendor]}>
            <Text style={styles.vendorEmoji}>{vendor.emoji}</Text>
            <View style={styles.flex}>
              <View style={styles.vendorNameRow}>
                <Text style={styles.vendorName}>{vendor.name}</Text>
                {vendor.verified && <MaterialIcons name="verified" size={16} color={Colors.primary} />}
              </View>
              <Text style={styles.vendorMeta}>★ {vendor.rating} · {vendor.location}</Text>
              <Text style={styles.vendorDesc}>{vendor.description}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.installer} onPress={() => router.push('/(tabs)/workers' as any)} activeOpacity={0.85}>
          <View style={styles.installerIcon}>
            <MaterialIcons name="engineering" size={26} color={Colors.onPrimary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.installerTitle}>Need it installed?</Text>
            <Text style={styles.installerSub}>Hire a vetted roofer or carpenter near you</Text>
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
  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 24, ...shadow },
  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  split: { flexDirection: 'row', gap: 12 },

  styleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  styleCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  styleCardActive: { borderColor: Colors.primary, borderWidth: 2, paddingVertical: 11, backgroundColor: Colors.greenTint + '4d' },
  styleText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  styleTextActive: { color: Colors.primary },

  result: { marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
  resultLabel: { fontSize: 14, color: Colors.onSurfaceVariant },
  resultBig: { fontSize: 36, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  resultUnit: { fontSize: 18, fontWeight: '600', color: Colors.onSurfaceVariant },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 12 },
  metric: { width: '50%' },
  metricValue: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  metricLabel: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  costLabel: { fontSize: 14, color: Colors.onSurfaceVariant, flex: 1 },
  cost: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 12 },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
  notice: { flexDirection: 'row', gap: 8, marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: Colors.amberLight + '80' },
  noticeText: { flex: 1, fontSize: 13, color: Colors.onSurface, lineHeight: 18 },
  footnote: { fontSize: 12, color: Colors.outline, marginTop: 12, lineHeight: 16 },
  resultEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background },
  resultEmptyText: { flex: 1, fontSize: 14, color: Colors.onSurfaceVariant },

  compareRow: { gap: 12, paddingBottom: 24 },
  compareCard: { width: 200, padding: 16, borderRadius: 8, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.divider, gap: 6 },
  compareCardActive: { borderColor: Colors.primary, borderWidth: 2, padding: 15 },
  compareHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLevel: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  costLevelOff: { color: Colors.outlineVariant },
  compareTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface, marginBottom: 4 },
  compareLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compareText: { fontSize: 13, color: Colors.onSurfaceVariant },
  compareUse: { fontSize: 13, fontWeight: '600', color: Colors.outline, marginTop: 6 },
  compareUseActive: { color: Colors.primary },

  vendor: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 12 },
  vendorEmoji: { fontSize: 36 },
  vendorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vendorName: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  vendorMeta: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  vendorDesc: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 4 },

  installer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 8, backgroundColor: Colors.primary },
  installerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  installerTitle: { fontSize: 16, fontWeight: '600', color: Colors.onPrimary },
  installerSub: { fontSize: 13, color: Colors.greenTint, marginTop: 2 },
});
