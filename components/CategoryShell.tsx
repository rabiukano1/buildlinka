import { Children, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { PRODUCTS, VENDORS, type Product } from '../constants/MockData';
import { useCart } from '../contexts/CartContext';
import { useSaved } from '../contexts/SavedItemsContext';
import ProductCard from './ProductCard';
import KeyboardAwareWrapper from './KeyboardAwareWrapper';

export const formatPrice = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
/** onChangeText filter that keeps digits and one decimal point. */
export const numeric = (set: (v: string) => void) => (t: string) => set(t.replace(/[^0-9.]/g, ''));

type Tip = { icon: string; title: string; text: string };

type ShellProps = {
  title: string;
  category: string;
  emoji: string;
  heroTitle: string;
  heroSub: string;
  trust: [string, string][];
  estimatorTitle: string;
  children: ReactNode;
  extra?: ReactNode;
  tips: Tip[];
  hire: { title: string; sub: string; icon: string };
};

export default function CategoryShell({ title, category, emoji, heroTitle, heroSub, trust, estimatorTitle, children, extra, tips, hire }: ShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();
  const [openTip, setOpenTip] = useState<number | null>(0);
  const products = PRODUCTS.filter((p) => p.category === category);
  const vendor = VENDORS.find((v) => v.category === category);

  return (
    <View style={s.container}>
      <KeyboardAwareWrapper contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        <CategoryHeader title={title} emoji={emoji} heroTitle={heroTitle} heroSub={heroSub} trust={trust} />

        <Text style={s.sectionTitle}>{estimatorTitle}</Text>
        <View style={s.card}>{children}</View>

        {extra}

        <Text style={[s.sectionTitle, s.sectionGap]}>Buying tips</Text>
        <View style={[s.card, s.tips]}>
          {tips.map((t, i) => {
            const open = openTip === i;
            return (
              <TouchableOpacity key={t.title} style={[s.tip, i > 0 && s.tipDivider]} onPress={() => setOpenTip(open ? null : i)} activeOpacity={0.7}>
                <View style={s.tipHead}>
                  <MaterialIcons name={t.icon as any} size={20} color={Colors.primary} />
                  <Text style={s.tipTitle}>{t.title}</Text>
                  <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={Colors.outline} />
                </View>
                {open && <Text style={s.tipText}>{t.text}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[s.sectionTitle, s.sectionGap]}>{category} products</Text>
        {products.length ? (
          products.map((p) => (
            <ProductCard key={p.id} product={p} horizontal onPress={() => router.push(`/product/${p.id}`)} onAddToCart={() => addItem(p)} onToggleSave={() => toggleSave(p)} isSaved={isSaved(p.id)} />
          ))
        ) : (
          <View style={[s.card, s.emptyProducts]}>
            <MaterialIcons name="inventory-2" size={28} color={Colors.outline} />
            <Text style={s.emptyTitle}>Vendors are joining soon</Text>
            <Text style={s.emptySub}>Use the calculator above to plan, then share your list with a vendor for a quote.</Text>
          </View>
        )}

        {vendor && (
          <View style={[s.card, s.vendor]}>
            <Text style={s.vendorEmoji}>{vendor.emoji}</Text>
            <View style={s.flex}>
              <View style={s.vendorNameRow}>
                <Text style={s.vendorName}>{vendor.name}</Text>
                {vendor.verified && <MaterialIcons name="verified" size={16} color={Colors.primary} />}
              </View>
              <Text style={s.vendorMeta}>★ {vendor.rating} · {vendor.location}</Text>
              <Text style={s.vendorDesc}>{vendor.description}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={s.hire} onPress={() => router.push('/(tabs)/workers' as any)} activeOpacity={0.85}>
          <View style={s.hireIcon}>
            <MaterialIcons name={hire.icon as any} size={26} color={Colors.onPrimary} />
          </View>
          <View style={s.flex}>
            <Text style={s.hireTitle}>{hire.title}</Text>
            <Text style={s.hireSub}>{hire.sub}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Colors.onPrimary} />
        </TouchableOpacity>
      </KeyboardAwareWrapper>
    </View>
  );
}

/** Green nav bar flowing into a full-width gradient banner. Render first inside a 16px-padded scroll view. */
export function CategoryHeader({ title, emoji, heroTitle, heroSub, trust }: { title: string; emoji: string; heroTitle: string; heroSub: string; trust: [string, string][] }) {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTitle: title, headerShadowVisible: false, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.onPrimary, headerTitleStyle: { fontWeight: '700' } }} />
      <StatusBar style="light" />
      <LinearGradient colors={[Colors.primary, Colors.darkGreen]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1.4 }} style={s.header}>
        <View style={s.headerRing} />
        <View style={s.headerTop}>
          <View style={s.flex}>
            <Text style={s.headerTitle}>{heroTitle}</Text>
            <Text style={s.headerSub}>{heroSub}</Text>
          </View>
          <View style={s.headerEmojiWrap}>
            <Text style={s.headerEmoji}>{emoji}</Text>
          </View>
        </View>
        <View style={s.trustRow}>
          {trust.map(([icon, label]) => (
            <View key={label} style={s.trust}>
              <MaterialIcons name={icon as any} size={14} color={Colors.greenTint} />
              <Text style={s.trustText}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </>
  );
}

/* ─── Estimator building blocks ─── */

export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

/** Side-by-side fields of equal width. */
export function Row({ children }: { children: ReactNode }) {
  return <View style={s.row}>{Children.map(children, (c) => <View style={s.flex}>{c}</View>)}</View>;
}

export function Wrap({ children, last }: { children: ReactNode; last?: boolean }) {
  return <View style={[s.wrap, last && s.noMargin]}>{children}</View>;
}

export function Stepper({ label, value, onChange, min = 0, max = 99 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepperLabel} numberOfLines={1}>{label}</Text>
      <View style={s.stepperCtrl}>
        <TouchableOpacity style={s.stepBtn} onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} accessibilityLabel={`Fewer ${label}`}>
          <MaterialIcons name="remove" size={18} color={value <= min ? Colors.outlineVariant : Colors.primary} />
        </TouchableOpacity>
        <Text style={s.stepValue}>{value}</Text>
        <TouchableOpacity style={s.stepBtn} onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} accessibilityLabel={`More ${label}`}>
          <MaterialIcons name="add" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function Result({ label, value, unit, metrics, children }: { label: string; value: string; unit?: string; metrics?: [string, string][]; children?: ReactNode }) {
  return (
    <View style={s.result}>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={s.resultBig}>{value}{unit ? <Text style={s.resultUnit}> {unit}</Text> : null}</Text>
      {metrics && metrics.length > 0 && (
        <View style={s.metrics}>
          {metrics.map(([v, l]) => (
            <View key={l} style={s.metric}>
              <Text style={s.metricValue}>{v}</Text>
              <Text style={s.metricLabel}>{l}</Text>
            </View>
          ))}
        </View>
      )}
      {children}
    </View>
  );
}

export function EmptyResult({ text }: { text: string }) {
  return (
    <View style={s.resultEmpty}>
      <MaterialIcons name="straighten" size={22} color={Colors.outline} />
      <Text style={s.resultEmptyText}>{text}</Text>
    </View>
  );
}

export function Notice({ text, icon = 'info-outline' }: { text: string; icon?: string }) {
  return (
    <View style={s.notice}>
      <MaterialIcons name={icon as any} size={18} color={Colors.tertiary} />
      <Text style={s.noticeText}>{text}</Text>
    </View>
  );
}

export function Footnote({ children }: { children: ReactNode }) {
  return <Text style={s.footnote}>{children}</Text>;
}

/** Cost line + add-to-cart for `qty` units of `product`, or a notice when nothing is stocked. */
export function OrderLine({ product, qty, what, missingText }: { product?: Product; qty: number; what: string; missingText: string }) {
  const router = useRouter();
  const { addItem } = useCart();
  if (!product) return <Notice text={missingText} />;
  const add = () => {
    addItem(product, qty);
    Alert.alert('Added to cart', `${qty} × ${product.name}`, [
      { text: 'Keep browsing', style: 'cancel' },
      { text: 'View cart', onPress: () => router.push('/cart' as any) },
    ]);
  };
  return (
    <>
      <View style={s.costRow}>
        <Text style={s.costLabel}>{qty.toLocaleString('en-NG')} {what} × {formatPrice(product.price)}</Text>
        <Text style={s.cost}>{formatPrice(product.price * qty)}</Text>
      </View>
      <TouchableOpacity style={[s.cta, !product.inStock && s.ctaOff]} onPress={add} disabled={!product.inStock || qty <= 0} activeOpacity={0.8}>
        <MaterialIcons name="add-shopping-cart" size={20} color={Colors.onSecondary} />
        <Text style={s.ctaText}>{product.inStock ? `Add ${qty.toLocaleString('en-NG')} ${what} to cart` : 'Out of stock'}</Text>
      </TouchableOpacity>
    </>
  );
}

export function ModeTabs<T extends string>({ modes, value, onChange }: { modes: readonly { id: T; label: string; icon: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.modeRow}>
      {modes.map((m) => {
        const active = m.id === value;
        return (
          <TouchableOpacity key={m.id} style={[s.mode, active && s.modeActive]} onPress={() => onChange(m.id)} activeOpacity={0.7}>
            <MaterialIcons name={m.icon as any} size={22} color={active ? Colors.primary : Colors.onSurfaceVariant} />
            <Text style={[s.modeText, active && s.modeTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const shadow = { shadowColor: '#1b1c1c', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  flex: { flex: 1 },
  noMargin: { marginBottom: 0 },

  header: { marginHorizontal: -16, marginTop: -16, marginBottom: 24, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  headerRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -70, top: -90, borderWidth: 32, borderColor: 'rgba(255,255,255,0.06)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.onPrimary, lineHeight: 30 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 20 },
  headerEmojiWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  headerEmoji: { fontSize: 38 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  trustText: { fontSize: 12, fontWeight: '600', color: Colors.onPrimary },

  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface, marginBottom: 12 },
  sectionGap: { marginTop: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 12, ...shadow },
  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },

  stepper: { flex: 1, marginBottom: 16 },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  stepperCtrl: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.onSurface },

  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mode: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  modeActive: { borderColor: Colors.primary, borderWidth: 2, paddingVertical: 11, backgroundColor: Colors.greenTint + '4d' },
  modeText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textAlign: 'center' },
  modeTextActive: { color: Colors.primary },

  result: { marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: Colors.background, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
  resultLabel: { fontSize: 14, color: Colors.onSurfaceVariant },
  resultBig: { fontSize: 36, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  resultUnit: { fontSize: 16, fontWeight: '600', color: Colors.onSurfaceVariant },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 12 },
  metric: { width: '50%' },
  metricValue: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  metricLabel: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  costLabel: { fontSize: 14, color: Colors.onSurfaceVariant, flex: 1 },
  cost: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 12 },
  ctaOff: { backgroundColor: Colors.outlineVariant },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
  notice: { flexDirection: 'row', gap: 8, marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: Colors.amberLight + '80' },
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

  emptyProducts: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.outline, textAlign: 'center', paddingHorizontal: 16 },

  vendor: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 12 },
  vendorEmoji: { fontSize: 36 },
  vendorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vendorName: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  vendorMeta: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  vendorDesc: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 4 },

  hire: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 8, backgroundColor: Colors.primary, marginTop: 12 },
  hireIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  hireTitle: { fontSize: 16, fontWeight: '600', color: Colors.onPrimary },
  hireSub: { fontSize: 13, color: Colors.greenTint, marginTop: 2 },
});
