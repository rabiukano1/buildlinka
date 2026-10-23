import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type BackendProduct } from '../../lib/backend';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import ProductCard from '../../components/ProductCard';
import KeyboardAwareWrapper from '../../components/KeyboardAwareWrapper';
import { CategoryHeader } from '../../components/CategoryShell';
import { Chip, Field } from '../../components/EngineerUI';
import { BAR_SIZES, unitWeight, slabMesh, members, barsWeight, stockBars, type RebarResult } from '../../lib/rebarEstimate';

const formatPrice = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
const kg = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(2)} t` : `${n.toFixed(1)} kg`);

const USES: Record<number, string> = {
  8: 'Links & stirrups',
  10: 'Light slabs, links',
  12: 'Slabs, lintels, beams',
  16: 'Columns, beams',
  20: 'Heavy columns',
  25: 'Foundations, heavy beams',
};

const MODES = [
  { id: 'slab', label: 'Slab mesh', icon: 'grid-4x4' },
  { id: 'members', label: 'Columns & beams', icon: 'view-column' },
  { id: 'weight', label: 'Weight check', icon: 'scale' },
] as const;
type Mode = (typeof MODES)[number]['id'];

const SECTIONS = [
  { label: '230 × 230', w: 230, d: 230 },
  { label: '230 × 300', w: 230, d: 300 },
  { label: '230 × 450', w: 230, d: 450 },
];

// "Iron Rod 12mm (6m)" → { dia: 12, length: 6 }
const rodSpec = (p: BackendProduct) => {
  const dia = p.name.match(/(\d+)\s*mm/i);
  const len = p.name.match(/\((\d+(?:\.\d+)?)\s*m\)/i);
  return dia ? { dia: Number(dia[1]), length: len ? Number(len[1]) : 12 } : null;
};

const TIPS = [
  { icon: 'scale', title: 'Weigh a bar before you pay', text: `A genuine 12 mm × 12 m bar weighs about ${(unitWeight(12) * 12).toFixed(1)} kg. Light bars are thinner than labelled — a common trick.` },
  { icon: 'search', title: 'Check the markings', text: 'Good rods have clear, even ribs and the mill name or grade rolled into the bar.' },
  { icon: 'water-drop', title: 'Rust', text: 'Light orange surface rust is fine. Flaking or pitted bars have lost steel — reject them.' },
];

export default function SteelIronScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();

  const steelProducts = useQuery(api.products.list, { category: 'Steel & Iron' }) ?? [];
  const stockedByDia = new Map(steelProducts.flatMap((p) => { const s = rodSpec(p); return s ? [[s.dia, { product: p, ...s }] as const] : []; }));

  const [mode, setMode] = useState<Mode>('slab');
  const [stockLen, setStockLen] = useState(12);
  const [lap, setLap] = useState(10);
  // slab
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [dia, setDia] = useState(12);
  const [spacing, setSpacing] = useState(200);
  const [layers, setLayers] = useState(1);
  // members
  const [count, setCount] = useState('');
  const [memberLen, setMemberLen] = useState('3');
  const [section, setSection] = useState(SECTIONS[0]);
  const [mainBars, setMainBars] = useState(4);
  const [mainDia, setMainDia] = useState(16);
  const [linkSpacing, setLinkSpacing] = useState(150);
  // weight
  const [barLen, setBarLen] = useState('12');
  const [barCount, setBarCount] = useState('');
  const [openTip, setOpenTip] = useState<number | null>(0);

  const result: RebarResult | null =
    mode === 'slab' ? slabMesh(parseFloat(length), parseFloat(width), dia, spacing, layers, lap)
    : mode === 'members' ? members(parseInt(count), parseFloat(memberLen), mainBars, mainDia, section.w, section.d, 8, linkSpacing, lap)
    : barsWeight(dia, parseFloat(barLen), parseInt(barCount));

  const orderable = result?.lines.flatMap((l) => {
    const s = stockedByDia.get(l.dia);
    return s ? [{ ...s, pieces: stockBars(l.length, s.length) }] : [];
  }) ?? [];
  const missing = result?.lines.filter((l) => !stockedByDia.has(l.dia)).map((l) => `${l.dia} mm`) ?? [];
  const orderCost = orderable.reduce((s, o) => s + o.pieces * o.product.price, 0);

  const addToCart = () => {
    orderable.forEach((o) => addItem(o.product, o.pieces));
    Alert.alert('Added to cart', orderable.map((o) => `${o.pieces} × ${o.product.name}`).join('\n'), [
      { text: 'Keep browsing', style: 'cancel' },
      { text: 'View cart', onPress: () => router.push('/cart' as any) },
    ]);
  };

  const num = (set: (v: string) => void) => (t: string) => set(t.replace(/[^0-9.]/g, ''));

  return (
    <View style={styles.container}>
      <KeyboardAwareWrapper contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <CategoryHeader title='Steel & Iron' emoji='🔩' heroTitle='Get your rebar right' heroSub='Work out rods, weight and binding wire for slabs, columns and beams.' trust={[['verified', 'Full-weight rods'], ['local-shipping', 'Site delivery'], ['content-cut', 'Cut & bend']]} />

        <Text style={styles.sectionTitle}>Bar size guide</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeRow}>
          {BAR_SIZES.map((d) => {
            const stocked = stockedByDia.get(d);
            return (
              <View key={d} style={[styles.sizeCard, stocked && styles.sizeCardStocked]}>
                <View style={[styles.sizeDot, { width: 8 + d, height: 8 + d, borderRadius: (8 + d) / 2 }]} />
                <Text style={styles.sizeTitle}>{d} mm</Text>
                <Text style={styles.sizeWeight}>{unitWeight(d).toFixed(2)} kg/m</Text>
                <Text style={styles.sizeUse}>{USES[d]}</Text>
                <Text style={[styles.sizeStock, stocked && styles.sizeStockOn]}>
                  {stocked ? `${formatPrice(stocked.product.price)} / ${stocked.length} m` : 'Not stocked yet'}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Rebar estimator</Text>
        <View style={styles.card}>
          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <TouchableOpacity key={m.id} style={[styles.mode, active && styles.modeActive]} onPress={() => setMode(m.id)} activeOpacity={0.7}>
                  <MaterialIcons name={m.icon as any} size={22} color={active ? Colors.primary : Colors.onSurfaceVariant} />
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === 'slab' && (
            <>
              <View style={styles.split}>
                <View style={styles.flex}><Field label="Slab length (m)" placeholder="5" keyboardType="decimal-pad" value={length} onChangeText={num(setLength)} /></View>
                <View style={styles.flex}><Field label="Slab width (m)" placeholder="4" keyboardType="decimal-pad" value={width} onChangeText={num(setWidth)} /></View>
              </View>
              <Text style={styles.label}>Bar size</Text>
              <View style={styles.wrap}>{[10, 12, 16].map((d) => <Chip key={d} label={`${d} mm`} active={dia === d} onPress={() => setDia(d)} />)}</View>
              <Text style={styles.label}>Spacing</Text>
              <View style={styles.wrap}>{[150, 200, 250].map((s) => <Chip key={s} label={`${s} mm`} active={spacing === s} onPress={() => setSpacing(s)} />)}</View>
              <Text style={styles.label}>Layers</Text>
              <View style={styles.wrap}>
                <Chip label="One layer" active={layers === 1} onPress={() => setLayers(1)} />
                <Chip label="Top & bottom" active={layers === 2} onPress={() => setLayers(2)} />
              </View>
            </>
          )}

          {mode === 'members' && (
            <>
              <View style={styles.split}>
                <View style={styles.flex}><Field label="How many" placeholder="8" keyboardType="number-pad" value={count} onChangeText={num(setCount)} /></View>
                <View style={styles.flex}><Field label="Each length (m)" placeholder="3" keyboardType="decimal-pad" value={memberLen} onChangeText={num(setMemberLen)} /></View>
              </View>
              <Text style={styles.label}>Size (mm)</Text>
              <View style={styles.wrap}>{SECTIONS.map((s) => <Chip key={s.label} label={s.label} active={section === s} onPress={() => setSection(s)} />)}</View>
              <Text style={styles.label}>Main bars</Text>
              <View style={styles.wrap}>
                {[4, 6, 8].map((n) => <Chip key={n} label={`${n} bars`} active={mainBars === n} onPress={() => setMainBars(n)} />)}
                {[12, 16, 20].map((d) => <Chip key={d} label={`${d} mm`} active={mainDia === d} onPress={() => setMainDia(d)} />)}
              </View>
              <Text style={styles.label}>8 mm links every</Text>
              <View style={styles.wrap}>{[150, 200].map((s) => <Chip key={s} label={`${s} mm`} active={linkSpacing === s} onPress={() => setLinkSpacing(s)} />)}</View>
            </>
          )}

          {mode === 'weight' && (
            <>
              <Text style={styles.label}>Bar size</Text>
              <View style={styles.wrap}>{BAR_SIZES.map((d) => <Chip key={d} label={`${d} mm`} active={dia === d} onPress={() => setDia(d)} />)}</View>
              <View style={styles.split}>
                <View style={styles.flex}><Field label="Length of each (m)" placeholder="12" keyboardType="decimal-pad" value={barLen} onChangeText={num(setBarLen)} /></View>
                <View style={styles.flex}><Field label="Number of bars" placeholder="10" keyboardType="number-pad" value={barCount} onChangeText={num(setBarCount)} /></View>
              </View>
            </>
          )}

          {mode !== 'weight' && (
            <>
              <Text style={styles.label}>Laps & offcuts</Text>
              <View style={styles.wrap}>{[0, 10, 15].map((l) => <Chip key={l} label={`+${l}%`} active={lap === l} onPress={() => setLap(l)} />)}</View>
            </>
          )}
          <Text style={styles.label}>Bars sold in</Text>
          <View style={[styles.wrap, styles.noMargin]}>{[12, 6].map((l) => <Chip key={l} label={`${l} m lengths`} active={stockLen === l} onPress={() => setStockLen(l)} />)}</View>

          {result ? (
            <View style={styles.result}>
              <Text style={styles.resultLabel}>Total steel</Text>
              <Text style={styles.resultBig}>{kg(result.totalWeight)}</Text>
              {result.lines.map((l) => (
                <View key={l.label} style={styles.line}>
                  <View style={styles.lineDia}><Text style={styles.lineDiaText}>{l.dia}</Text></View>
                  <View style={styles.flex}>
                    <Text style={styles.lineTitle}>{stockBars(l.length, stockLen)} bars of {stockLen} m</Text>
                    <Text style={styles.lineSub}>{l.label} · {l.length.toFixed(0)} m · {kg(l.weight)}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.line}>
                <View style={[styles.lineDia, styles.wireDot]}><MaterialIcons name="all-inclusive" size={16} color={Colors.onSurfaceVariant} /></View>
                <View style={styles.flex}>
                  <Text style={styles.lineTitle}>{result.bindingWireKg} kg binding wire</Text>
                  <Text style={styles.lineSub}>About 10 kg per tonne of rebar</Text>
                </View>
              </View>

              {orderable.length > 0 && (
                <>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>{orderable.map((o) => `${o.pieces} × ${o.dia} mm (${o.length} m)`).join(', ')}</Text>
                    <Text style={styles.cost}>{formatPrice(orderCost)}</Text>
                  </View>
                  <TouchableOpacity style={styles.cta} onPress={addToCart} activeOpacity={0.8}>
                    <MaterialIcons name="add-shopping-cart" size={20} color={Colors.onSecondary} />
                    <Text style={styles.ctaText}>Add {orderable.reduce((s, o) => s + o.pieces, 0)} rods to cart</Text>
                  </TouchableOpacity>
                </>
              )}
              {missing.length > 0 && (
                <View style={styles.notice}>
                  <MaterialIcons name="info-outline" size={18} color={Colors.tertiary} />
                  <Text style={styles.noticeText}>{missing.join(' and ')} {missing.length > 1 ? "aren't" : "isn't"} sold on BuildLinka yet — share this list with a vendor for a quote.</Text>
                </View>
              )}
              <Text style={styles.footnote}>Uses 25 mm cover and d²/162 kg/m. Your engineer's drawings always win — use this to budget and check quotes.</Text>
            </View>
          ) : (
            <View style={styles.resultEmpty}>
              <MaterialIcons name="straighten" size={22} color={Colors.outline} />
              <Text style={styles.resultEmptyText}>Fill in the sizes above to see rods, weight and cost.</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Avoid bad rods</Text>
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

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Steel products</Text>
        {steelProducts.map((p) => (
          <ProductCard key={p._id} product={p} horizontal onPress={() => router.push(`/product/${p._id}`)} onAddToCart={() => addItem(p)} onToggleSave={() => toggleSave(p)} isSaved={isSaved(p._id)} />
        ))}

        <TouchableOpacity style={styles.installer} onPress={() => router.push('/(tabs)/workers' as any)} activeOpacity={0.85}>
          <View style={styles.installerIcon}>
            <MaterialIcons name="construction" size={26} color={Colors.onPrimary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.installerTitle}>Need an iron bender or welder?</Text>
            <Text style={styles.installerSub}>Hire vetted steel fabricators near you</Text>
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

  sizeRow: { gap: 10, paddingBottom: 24 },
  sizeCard: { width: 132, padding: 12, borderRadius: 8, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.divider, gap: 2 },
  sizeCardStocked: { borderColor: Colors.primary, borderWidth: 2, padding: 11 },
  sizeDot: { backgroundColor: Colors.onSurfaceVariant, marginBottom: 8 },
  sizeTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  sizeWeight: { fontSize: 13, fontWeight: '600', color: Colors.secondary },
  sizeUse: { fontSize: 12, color: Colors.onSurfaceVariant, minHeight: 32 },
  sizeStock: { fontSize: 12, color: Colors.outline, marginTop: 4 },
  sizeStockOn: { color: Colors.primary, fontWeight: '700' },

  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mode: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  modeActive: { borderColor: Colors.primary, borderWidth: 2, paddingVertical: 11, backgroundColor: Colors.greenTint + '4d' },
  modeText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textAlign: 'center' },
  modeTextActive: { color: Colors.primary },

  result: { marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
  resultLabel: { fontSize: 14, color: Colors.onSurfaceVariant },
  resultBig: { fontSize: 36, fontWeight: '700', color: Colors.onSurface, marginTop: 2, marginBottom: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  lineDia: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.onSurfaceVariant, alignItems: 'center', justifyContent: 'center' },
  lineDiaText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  wireDot: { backgroundColor: Colors.surfaceVariant },
  lineTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  lineSub: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  costLabel: { fontSize: 13, color: Colors.onSurfaceVariant, flex: 1 },
  cost: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 12 },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
  notice: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: Colors.amberLight + '80' },
  noticeText: { flex: 1, fontSize: 13, color: Colors.onSurface, lineHeight: 18 },
  footnote: { fontSize: 12, color: Colors.outline, marginTop: 12, lineHeight: 16 },
  resultEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background },
  resultEmptyText: { flex: 1, fontSize: 14, color: Colors.onSurfaceVariant },

  tips: { paddingVertical: 4 },
  tip: { paddingVertical: 12 },
  tipDivider: { borderTopWidth: 1, borderTopColor: Colors.divider },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  tipText: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, marginTop: 8, marginLeft: 32 },

  vendor: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 12 },
  vendorEmoji: { fontSize: 36 },
  vendorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vendorName: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  vendorMeta: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  vendorDesc: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 4 },

  installer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 8, backgroundColor: Colors.primary, marginTop: 12 },
  installerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  installerTitle: { fontSize: 16, fontWeight: '600', color: Colors.onPrimary },
  installerSub: { fontSize: 13, color: Colors.greenTint, marginTop: 2 },
});
