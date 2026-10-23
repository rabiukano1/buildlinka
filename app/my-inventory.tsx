import { Component, useState, useMemo, type ReactNode } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { formatPrice, errorMessage, type BackendProduct } from '../lib/backend';
import { Colors } from '../constants/Colors';

/** Shown when the signed-in user has no store yet (store queries throw then). */
function NoStoreState() {
  const router = useRouter();
  return (
    <View style={styles.centerWrap}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons name="store" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Create your store first</Text>
      <Text style={styles.emptySubtitle}>
        You need a vendor store before you can manage inventory.
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.push('/create-store' as any)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-business" size={18} color={Colors.onPrimary} />
        <Text style={styles.primaryBtnText}>Create your store</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Catches the ConvexError thrown when the user has no store, so the
 *  screen shows the create-store CTA instead of crashing. */
class StoreErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <NoStoreState />;
    return this.props.children;
  }
}

type MineProduct = BackendProduct & { costPrice: number | null; minStock: number };

function InventoryCard({
  item,
  onAdjust,
}: {
  item: MineProduct;
  onAdjust: (id: string, delta: number) => void;
}) {
  const isLow = item.stock <= item.minStock;
  const isOut = item.stock === 0;
  const stockStatus = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
  const statusColor = isOut ? Colors.error : isLow ? Colors.warning : Colors.success;
  const stockRatio = Math.min(item.stock / Math.max(item.minStock, 1), 2);
  const barWidth = Math.min((stockRatio / 2) * 100, 100);
  const margin = item.costPrice ? Math.round(((item.price - item.costPrice) / item.costPrice) * 100) : null;

  return (
    <View style={[styles.invCard, isLow && styles.invCardLow]}>
      <View style={styles.invCardLeft}>
        <View style={styles.invEmojiBadge}>
          <Text style={styles.invEmoji}>📦</Text>
        </View>
      </View>
      <View style={styles.invCardBody}>
        <View style={styles.invCardTop}>
          <View style={styles.invTitleArea}>
            <Text style={styles.invTitle} numberOfLines={1}>{item.name}</Text>
            {!!item.barcode && <Text style={styles.invSku}>{item.barcode}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{stockStatus}</Text>
          </View>
        </View>
        <Text style={styles.invCategory}>{item.category} · {item.status}</Text>
        <View style={styles.stockBarTrack}>
          <View style={[styles.stockBarFill, { width: `${barWidth}%`, backgroundColor: statusColor }]} />
        </View>
        <View style={styles.invMetrics}>
          <View style={styles.invMetric}>
            <Text style={styles.invMetricLabel}>In Stock</Text>
            <Text style={[styles.invMetricValue, isLow && { color: statusColor }]}>
              {item.stock}
              <Text style={styles.invMetricUnit}> / {item.minStock}</Text>
            </Text>
          </View>
          <View style={styles.invMetric}>
            <Text style={styles.invMetricLabel}>Selling Price</Text>
            <Text style={styles.invMetricValue}>{formatPrice(item.price)}</Text>
          </View>
          <View style={styles.invMetric}>
            <Text style={styles.invMetricLabel}>Margin</Text>
            <Text style={[styles.invMetricValue, { color: Colors.success }]}>
              {margin === null ? '—' : `${margin}%`}
            </Text>
          </View>
        </View>
        <View style={styles.invActions}>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => onAdjust(item._id as never, -1)}
              accessibilityLabel="Decrease stock"
            >
              <MaterialIcons name="remove" size={14} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.stock}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => onAdjust(item._id as never, 1)}
              accessibilityLabel="Increase stock"
            >
              <MaterialIcons name="add" size={14} color={Colors.textMedium} />
            </TouchableOpacity>
          </View>
          <Text style={styles.invDate}>per {item.unit}</Text>
        </View>
      </View>
    </View>
  );
}

function InventoryBody() {
  const [searchQuery, setSearchQuery] = useState('');
  const products = useQuery(api.products.mine, {});
  const adjustStock = useMutation(api.products.adjustStock);

  const filteredInventory = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.barcode ?? '').toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const kpis = useMemo(() => {
    const list = products ?? [];
    const totalUnits = list.reduce((s, i) => s + i.stock, 0);
    const totalValue = list.reduce((s, i) => s + i.price * i.stock, 0);
    const lowStock = list.filter((i) => i.stock <= i.minStock).length;
    return { totalUnits, lowStock, totalValue };
  }, [products]);

  const handleAdjust = async (id: string, delta: number) => {
    try {
      await adjustStock({ id: id as never, delta });
    } catch (e) {
      Alert.alert('Could not update stock', errorMessage(e));
    }
  };

  if (products === undefined) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.emptySubtitle}>Loading your inventory…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredInventory}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <InventoryCard item={item as MineProduct} onAdjust={handleAdjust} />
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
              <Text style={styles.kpiValue}>{kpis.totalUnits}</Text>
              <Text style={styles.kpiLabel}>Total Stock</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: kpis.lowStock > 0 ? Colors.warning : Colors.success }]}>
              <Text style={[styles.kpiValue, { color: kpis.lowStock > 0 ? Colors.warning : Colors.success }]}>
                {kpis.lowStock}
              </Text>
              <Text style={styles.kpiLabel}>Low Stock Items</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.secondary }]}>
              <Text style={styles.kpiValue}>{formatPrice(kpis.totalValue)}</Text>
              <Text style={styles.kpiLabel}>Total Value</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={18} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, category, or barcode..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>All Products</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{filteredInventory.length} items</Text>
            </View>
          </View>
        </View>
      }
      ListHeaderComponentStyle={styles.listHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialIcons name="inventory" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>{searchQuery ? 'No items found' : 'No products yet'}</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different search term' : 'Add your first listing to start tracking inventory.'}
          </Text>
        </View>
      }
    />
  );
}

export default function MyInventoryScreen() {
  const me = useQuery(api.users.me);

  if (me === undefined) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTitle: 'My Inventory',
              headerBackTitle: 'Back',
              headerTintColor: Colors.primary,
            }}
          />
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'My Inventory',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        {!me?.store ? (
          <NoStoreState />
        ) : (
          <StoreErrorBoundary>
            <InventoryBody />
          </StoreErrorBoundary>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listHeader: {
    flexGrow: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },

  /* ─── KPI Row ─── */
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 3,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
  },
  kpiLabel: {
    fontSize: 10,
    color: Colors.textMedium,
    fontWeight: '500',
  },

  /* ─── Search ─── */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
    padding: 0,
  },

  /* ─── Section ─── */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  sectionCount: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },

  /* ─── Inventory Card ─── */
  invCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  invCardLow: {
    borderLeftColor: Colors.warning,
  },
  invCardLeft: {
    marginRight: 10,
  },
  invEmojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invEmoji: {
    fontSize: 22,
  },
  invCardBody: {
    flex: 1,
    gap: 4,
  },
  invCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invTitleArea: {
    flex: 1,
    gap: 1,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  invSku: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  invCategory: {
    fontSize: 10.5,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  stockBarTrack: {
    height: 5,
    backgroundColor: Colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  invMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  invMetric: {
    flex: 1,
    gap: 1,
  },
  invMetricLabel: {
    fontSize: 9.5,
    color: Colors.textLight,
    fontWeight: '500',
  },
  invMetricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  invMetricUnit: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
  },
  invActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 99,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
    minWidth: 18,
    textAlign: 'center',
  },
  invDate: {
    fontSize: 9.5,
    color: Colors.textLight,
    marginTop: 2,
  },

  /* ─── Empty ─── */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.primary, marginTop: 8 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
});
