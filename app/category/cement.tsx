import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS, type Product } from '../../constants/MockData';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';
import KeyboardAwareWrapper from '../../components/KeyboardAwareWrapper';

const { width } = Dimensions.get('window');

const BRANDS = [
  { name: 'Dangote', emoji: '🏗️', color: '#1B5E20' },
  { name: 'BUA', emoji: '🏗️', color: '#BF360C' },
  { name: 'Elephant', emoji: '🏗️', color: '#1565C0' },
  { name: 'Ibeto', emoji: '🏗️', color: '#6A1B9A' },
];

const BULK_DEALS = [
  { id: 'b1', title: 'Trailer Load', bags: 600, discount: '15% Off', price: '₦4,800,000' },
  { id: 'b2', title: 'Half Trailer', bags: 300, discount: '10% Off', price: '₦2,450,000' },
  { id: 'b3', title: 'Wholesale Pack', bags: 100, discount: '5% Off', price: '₦820,000' },
];

export default function CementCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [area, setArea] = useState('');
  const [thickness, setThickness] = useState('4'); // inches

  const cementProducts = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.category === 'Cement');
    if (selectedBrand !== 'All') {
      list = list.filter((p) => p.name.includes(selectedBrand));
    }
    return list;
  }, [selectedBrand]);

  const bagsNeeded = useMemo(() => {
    const numArea = parseFloat(area);
    if (isNaN(numArea) || numArea <= 0) return 0;
    // Rough estimation: 1 bag for ~4-5 sqm at 4-inch thickness
    const factor = (parseFloat(thickness) / 4) * 0.22;
    return Math.ceil(numArea * factor);
  }, [area, thickness]);

  return (
    <View style={styles.container}>
      <KeyboardAwareWrapper showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* ─── Modern Header ─── */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerEmoji}>🏗️</Text>
            <Text style={styles.headerTitle}>Premium Cement</Text>
            <Text style={styles.headerSub}>Quality verified supply for all project sizes</Text>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <MaterialIcons name="verified" size={14} color={Colors.greenTint} />
                <Text style={styles.trustText}>Verified Quality</Text>
              </View>
              <View style={styles.trustItem}>
                <MaterialIcons name="local-shipping" size={14} color={Colors.greenTint} />
                <Text style={styles.trustText}>Fast Delivery</Text>
              </View>
            </View>
          </View>
          {/* Decorative shapes */}
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
        </LinearGradient>

        {/* ─── Brand Highlights ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Brands</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandScroll}>
            <TouchableOpacity
              style={[styles.brandCard, selectedBrand === 'All' && styles.brandCardActive]}
              onPress={() => setSelectedBrand('All')}
            >
              <Text style={[styles.brandName, selectedBrand === 'All' && styles.brandNameActive]}>All Brands</Text>
            </TouchableOpacity>
            {BRANDS.map((brand) => (
              <TouchableOpacity
                key={brand.name}
                style={[styles.brandCard, selectedBrand === brand.name && styles.brandCardActive]}
                onPress={() => setSelectedBrand(brand.name)}
              >
                <Text style={styles.brandEmoji}>{brand.emoji}</Text>
                <Text style={[styles.brandName, selectedBrand === brand.name && styles.brandNameActive]}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Bulk Deals ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bulk Buying Deals</Text>
            <Text style={styles.saveTag}>SAVE BIG</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bulkScroll}>
            {BULK_DEALS.map((deal) => (
              <TouchableOpacity key={deal.id} style={styles.bulkCard}>
                <View style={styles.bulkBadge}>
                  <Text style={styles.bulkBadgeText}>{deal.discount}</Text>
                </View>
                <Text style={styles.bulkTitle}>{deal.title}</Text>
                <Text style={styles.bulkBags}>{deal.bags} Bags</Text>
                <Text style={styles.bulkPrice}>{deal.price}</Text>
                <View style={styles.bulkAction}>
                  <Text style={styles.bulkActionText}>View Deal</Text>
                  <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Bag Calculator ─── */}
        <View style={styles.section}>
          <View style={styles.calcCard}>
            <LinearGradient
              colors={['#f8f9fa', '#ffffff']}
              style={styles.calcInner}
            >
              <View style={styles.calcHeader}>
                <MaterialIcons name="calculate" size={24} color={Colors.primary} />
                <Text style={styles.calcTitle}>Cement Bag Calculator</Text>
              </View>
              <Text style={styles.calcSub}>Estimate bags for floor plastering/screeding</Text>
              
              <View style={styles.calcInputRow}>
                <View style={styles.calcInputGroup}>
                  <Text style={styles.calcInputLabel}>Area (sqm)</Text>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="e.g. 50"
                    keyboardType="numeric"
                    value={area}
                    onChangeText={setArea}
                  />
                </View>
                <View style={styles.calcInputGroup}>
                  <Text style={styles.calcInputLabel}>Thickness (in)</Text>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="4"
                    keyboardType="numeric"
                    value={thickness}
                    onChangeText={setThickness}
                  />
                </View>
              </View>

              {bagsNeeded > 0 && (
                <View style={styles.resultArea}>
                  <Text style={styles.resultLabel}>Estimated Bags Needed:</Text>
                  <Text style={styles.resultValue}>{bagsNeeded} Bags</Text>
                  <Text style={styles.resultNote}>*Estimated based on standard mix ratio (1:4)</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* ─── Product List ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          <View style={styles.productList}>
            {cementProducts.map((p) => (
              <ProductCard key={p.id} product={p} horizontal onPress={() => router.push(`/product/${p.id}`)} onAddToCart={() => addItem(p)} />
            ))}
          </View>
        </View>
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 220,
    padding: 24,
    paddingTop: 40,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  headerContent: {
    zIndex: 2,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  trustText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  shape: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  shape1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  shape2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 12,
  },
  saveTag: {
    backgroundColor: Colors.secondary,
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandScroll: {
    gap: 10,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  brandCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  brandEmoji: { fontSize: 18 },
  brandName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  brandNameActive: {
    color: '#fff',
  },
  bulkScroll: {
    gap: 12,
  },
  bulkCard: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bulkBadge: {
    backgroundColor: Colors.secondaryContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  bulkBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSecondaryContainer,
  },
  bulkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  bulkBags: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  bulkPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 8,
  },
  bulkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  bulkActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  calcCard: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calcInner: {
    padding: 18,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  calcTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  calcSub: {
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 16,
  },
  calcInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calcInputGroup: {
    flex: 1,
    gap: 6,
  },
  calcInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
  },
  calcInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textDark,
  },
  resultArea: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.secondary,
    marginTop: 4,
  },
  resultNote: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
  },
  productList: {
    gap: 12,
    marginTop: 8,
  },
});
