import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../constants/MockData';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';
import KeyboardAwareWrapper from '../../components/KeyboardAwareWrapper';

const GLASS_TYPES = [
  { name: 'All', icon: '🪟' },
  { name: 'Clear', icon: '🔲' },
  { name: 'Tinted', icon: '🟦' },
  { name: 'Frosted', icon: '⬜' },
  { name: 'Mirror', icon: '🪞' },
];

const GLASS_DEALS = [
  { id: 'g1', title: 'Clear Sheet Pack', qty: '10 pcs', discount: '10% Off', price: '₦85,000' },
  { id: 'g2', title: 'Tinted Bundle', qty: '8 pcs', discount: '12% Off', price: '₦95,000' },
  { id: 'g3', title: 'Mirror Set', qty: '6 pcs', discount: '8% Off', price: '₦72,000' },
];

export default function GlassScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [selectedType, setSelectedType] = useState('All');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');

  const products = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.category === 'Glass');
    if (selectedType !== 'All') {
      list = list.filter((p) => p.name.toLowerCase().includes(selectedType.toLowerCase()));
    }
    return list;
  }, [selectedType]);

  const area = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(width);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return '0';
    return (h * w).toFixed(2);
  }, [height, width]);

  return (
    <View style={styles.container}>
      <KeyboardAwareWrapper showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <LinearGradient colors={[Colors.tertiary, Colors.tertiaryContainer]} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerEmoji}>🪟</Text>
            <Text style={styles.headerTitle}>Glass</Text>
            <Text style={styles.headerSub}>Clear, tinted, frosted glass & mirrors for all uses</Text>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <MaterialIcons name="verified" size={14} color={Colors.amberLight} />
                <Text style={styles.trustText}>Tempered</Text>
              </View>
              <View style={styles.trustItem}>
                <MaterialIcons name="security" size={14} color={Colors.amberLight} />
                <Text style={styles.trustText}>Safety Glass</Text>
              </View>
            </View>
          </View>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Glass Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {GLASS_TYPES.map((t) => (
              <TouchableOpacity key={t.name} style={[styles.chip, selectedType === t.name && styles.chipActive]} onPress={() => setSelectedType(t.name)}>
                <Text style={styles.chipIcon}>{t.icon}</Text>
                <Text style={[styles.chipText, selectedType === t.name && styles.chipTextActive]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bulk Deals</Text>
            <Text style={styles.saveTag}>DISCOUNT</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealScroll}>
            {GLASS_DEALS.map((d) => (
              <TouchableOpacity key={d.id} style={styles.dealCard}>
                <View style={styles.dealBadge}><Text style={styles.dealBadgeText}>{d.discount}</Text></View>
                <Text style={styles.dealTitle}>{d.title}</Text>
                <Text style={styles.dealQty}>{d.qty}</Text>
                <Text style={styles.dealPrice}>{d.price}</Text>
                <View style={styles.dealAction}>
                  <Text style={styles.dealActionText}>View Deal</Text>
                  <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.calcCard}>
            <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.calcInner}>
              <View style={styles.calcHeader}>
                <MaterialIcons name="aspect-ratio" size={24} color={Colors.tertiary} />
                <Text style={styles.calcTitle}>Glass Area Calculator</Text>
              </View>
              <Text style={styles.calcSub}>Calculate glass sheet area in square metres</Text>
              <View style={styles.calcInputRow}>
                <View style={styles.calcInputGroup}>
                  <Text style={styles.calcInputLabel}>Height (mm)</Text>
                  <TextInput style={styles.calcInput} placeholder="e.g. 1800" keyboardType="numeric" value={height} onChangeText={setHeight} />
                </View>
                <View style={styles.calcInputGroup}>
                  <Text style={styles.calcInputLabel}>Width (mm)</Text>
                  <TextInput style={styles.calcInput} placeholder="e.g. 1200" keyboardType="numeric" value={width} onChangeText={setWidth} />
                </View>
              </View>
              {parseFloat(area) > 0 && (
                <View style={styles.resultArea}>
                  <Text style={styles.resultLabel}>Sheet Area:</Text>
                  <Text style={styles.resultValue}>{area} m²</Text>
                  <Text style={styles.resultNote}>*Single pane measurement</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          <View style={styles.productList}>
            {products.length > 0 ? products.map((p) => (
              <ProductCard key={p.id} product={p} horizontal onPress={() => router.push(`/product/${p.id}`)} onAddToCart={() => addItem(p)} />
            )) : (
              <View style={styles.empty}><Text style={styles.emptyIcon}>🪟</Text><Text style={styles.emptyText}>No products yet</Text></View>
            )}
          </View>
        </View>
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 220, padding: 24, paddingTop: 40, overflow: 'hidden', justifyContent: 'center' },
  headerContent: { zIndex: 2 },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  trustRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  trustText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  shape: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  shape1: { width: 200, height: 200, top: -50, right: -50 },
  shape2: { width: 150, height: 150, bottom: -30, left: -20 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark, marginBottom: 12 },
  saveTag: { backgroundColor: Colors.secondary, color: '#fff', fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  chipScroll: { gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  chipActive: { backgroundColor: Colors.tertiary, borderColor: Colors.tertiary },
  chipIcon: { fontSize: 18 },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textMedium },
  chipTextActive: { color: '#fff' },
  dealScroll: { gap: 12 },
  dealCard: { width: 160, backgroundColor: Colors.card, borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: Colors.secondary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dealBadge: { backgroundColor: Colors.secondaryContainer, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  dealBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.onSecondaryContainer },
  dealTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  dealQty: { fontSize: 12, color: Colors.textMedium, marginTop: 2 },
  dealPrice: { fontSize: 16, fontWeight: '800', color: Colors.tertiary, marginTop: 8 },
  dealAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  dealActionText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  calcCard: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: Colors.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  calcInner: { padding: 18 },
  calcHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  calcTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  calcSub: { fontSize: 12, color: Colors.textMedium, marginBottom: 16 },
  calcInputRow: { flexDirection: 'row', gap: 12 },
  calcInputGroup: { flex: 1, gap: 6 },
  calcInputLabel: { fontSize: 11, fontWeight: '700', color: Colors.textLight },
  calcInput: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: Colors.textDark },
  resultArea: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, alignItems: 'center' },
  resultLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMedium },
  resultValue: { fontSize: 24, fontWeight: '900', color: Colors.tertiary, marginTop: 4 },
  resultNote: { fontSize: 10, color: Colors.textMuted, marginTop: 6 },
  productList: { gap: 12, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 13, color: Colors.textLight },
});
