import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
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

const STEEL_TYPES = [
  { name: 'All', icon: '🔩' },
  { name: 'Iron Rods', icon: '⚙️' },
  { name: 'Sheets', icon: '📋' },
  { name: 'Beams', icon: '📐' },
  { name: 'Pipes', icon: '🔧' },
  { name: 'Wire', icon: '🔄' },
];

const STEEL_DEALS = [
  { id: 's1', title: 'Bulk Rod Bundle', qty: '100 pcs', discount: '12% Off', price: '₦598,400' },
  { id: 's2', title: 'Steel Sheet Pack', qty: '20 sheets', discount: '8% Off', price: '₦285,000' },
  { id: 's3', title: 'Pipe Fittings Set', qty: '50 pcs', discount: '10% Off', price: '₦142,000' },
];

export default function SteelIronScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [selectedType, setSelectedType] = useState('All');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('1');

  const steelProducts = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.category === 'Steel & Iron');
    if (selectedType !== 'All') {
      list = list.filter((p) => p.name.toLowerCase().includes(selectedType === 'Iron Rods' ? 'rod' : selectedType.toLowerCase().slice(0, -1)));
    }
    return list;
  }, [selectedType]);

  const totalWeight = useMemo(() => {
    const numLen = parseFloat(length);
    const numQty = parseInt(quantity) || 1;
    if (isNaN(numLen) || numLen <= 0) return '0';
    return (numLen * 0.888 * numQty).toFixed(1);
  }, [length, quantity]);

  return (
    <View style={styles.container}>
      <KeyboardAwareWrapper showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerEmoji}>🔩</Text>
            <Text style={styles.headerTitle}>Steel & Iron</Text>
            <Text style={styles.headerSub}>Premium structural steel for every project</Text>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <MaterialIcons name="verified" size={14} color={Colors.greenTint} />
                <Text style={styles.trustText}>Standard Grade</Text>
              </View>
              <View style={styles.trustItem}>
                <MaterialIcons name="local-shipping" size={14} color={Colors.greenTint} />
                <Text style={styles.trustText}>Nationwide Delivery</Text>
              </View>
            </View>
          </View>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steel Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
            {STEEL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.name}
                style={[styles.typeCard, selectedType === type.name && styles.typeCardActive]}
                onPress={() => setSelectedType(type.name)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[styles.typeName, selectedType === type.name && styles.typeNameActive]}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bulk Steel Deals</Text>
            <Text style={styles.saveTag}>WHOLESALE</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealScroll}>
            {STEEL_DEALS.map((deal) => (
              <TouchableOpacity key={deal.id} style={styles.dealCard}>
                <View style={styles.dealBadge}>
                  <Text style={styles.dealBadgeText}>{deal.discount}</Text>
                </View>
                <Text style={styles.dealTitle}>{deal.title}</Text>
                <Text style={styles.dealQty}>{deal.qty}</Text>
                <Text style={styles.dealPrice}>{deal.price}</Text>
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
                <MaterialIcons name="straighten" size={24} color={Colors.primary} />
                <Text style={styles.calcTitle}>Steel Weight Calculator</Text>
              </View>
              <Text style={styles.calcSub}>Estimate total weight for iron rods (12mm)</Text>

              <View style={styles.calcInputRow}>
                <View style={styles.calcInputGroup}>
                  <Text style={styles.calcInputLabel}>Length (m)</Text>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="e.g. 6"
                    keyboardType="numeric"
                    value={length}
                    onChangeText={setLength}
                  />
                </View>
                <View style={styles.calcInputGroup}>
                  <Text style={styles.calcInputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="1"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
              </View>

              {parseFloat(totalWeight) > 0 && (
                <View style={styles.resultArea}>
                  <Text style={styles.resultLabel}>Estimated Total Weight:</Text>
                  <Text style={styles.resultValue}>{totalWeight} kg</Text>
                  <Text style={styles.resultNote}>*Based on 12mm rod (0.888 kg/m)</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          <View style={styles.productList}>
            {steelProducts.length > 0 ? (
              steelProducts.map((p) => (
                <ProductCard key={p.id} product={p} horizontal onPress={() => router.push(`/product/${p.id}`)} onAddToCart={() => addItem(p)} />
              ))
            ) : (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyIcon}>🔩</Text>
                <Text style={styles.emptyText}>No products in this category yet</Text>
              </View>
            )}
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
  typeScroll: {
    gap: 10,
  },
  typeCard: {
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
  typeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeIcon: { fontSize: 18 },
  typeName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  typeNameActive: {
    color: '#fff',
  },
  dealScroll: {
    gap: 12,
  },
  dealCard: {
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
  dealBadge: {
    backgroundColor: Colors.secondaryContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  dealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSecondaryContainer,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  dealQty: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 8,
  },
  dealAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  dealActionText: {
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
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textLight,
  },
});
