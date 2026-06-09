import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

type InventoryItem = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  sku: string;
  inStock: number;
  minStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  lastRestocked: string;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', title: 'Dangote Cement 42.5R (50kg)', emoji: '🏗️', category: 'Cement', sku: 'DGT-CMT-001', inStock: 48, minStock: 20, unit: 'bag', costPrice: 6200, sellingPrice: 8500, lastRestocked: '2 Jun 2026' },
  { id: 'inv-2', title: 'Elephant Cement (50kg)', emoji: '🏗️', category: 'Cement', sku: 'ELP-CMT-002', inStock: 12, minStock: 15, unit: 'bag', costPrice: 5900, sellingPrice: 8200, lastRestocked: '28 May 2026' },
  { id: 'inv-3', title: 'Iron Rod 12mm (6m)', emoji: '⚙️', category: 'Steel & Iron', sku: 'STL-IRD-003', inStock: 25, minStock: 10, unit: 'piece', costPrice: 5000, sellingPrice: 6800, lastRestocked: '25 May 2026' },
  { id: 'inv-4', title: 'Iron Rod 16mm (6m)', emoji: '⚙️', category: 'Steel & Iron', sku: 'STL-IRD-004', inStock: 8, minStock: 10, unit: 'piece', costPrice: 7200, sellingPrice: 9500, lastRestocked: '20 May 2026' },
  { id: 'inv-5', title: 'Ceramic Floor Tiles 60x60cm', emoji: '🏛️', category: 'Tiles', sku: 'TLW-TLE-005', inStock: 85, minStock: 30, unit: 'box', costPrice: 2200, sellingPrice: 3500, lastRestocked: '15 May 2026' },
  { id: 'inv-6', title: 'Aluminum Roofing Sheet 0.5mm', emoji: '🏠', category: 'Roofing', sku: 'ROF-SHT-006', inStock: 18, minStock: 10, unit: 'sheet', costPrice: 3100, sellingPrice: 4200, lastRestocked: '10 May 2026' },
  { id: 'inv-7', title: 'PVC Water Pipe 3/4 inch (9m)', emoji: '🔧', category: 'Plumbing', sku: 'PLB-PVC-007', inStock: 3, minStock: 15, unit: 'piece', costPrice: 1900, sellingPrice: 2800, lastRestocked: '5 May 2026' },
  { id: 'inv-8', title: 'Emulsion Paint 20L (White)', emoji: '🎨', category: 'Paint', sku: 'PNT-EMS-008', inStock: 14, minStock: 10, unit: 'bucket', costPrice: 9000, sellingPrice: 12500, lastRestocked: '20 Apr 2026' },
];

function InventoryCard({
  item,
  onUpdateStock,
}: {
  item: InventoryItem;
  onUpdateStock: (id: string, delta: number) => void;
}) {
  const isLow = item.inStock <= item.minStock;
  const isOut = item.inStock === 0;
  const stockStatus = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
  const statusColor = isOut ? Colors.error : isLow ? Colors.warning : Colors.success;
  const stockRatio = Math.min(item.inStock / item.minStock, 2);
  const barWidth = Math.min((stockRatio / 2) * 100, 100);
  const barColor = isOut ? Colors.error : isLow ? Colors.warning : Colors.success;

  return (
    <View style={[styles.invCard, isLow && styles.invCardLow]}>
      <View style={styles.invCardLeft}>
        <View style={styles.invEmojiBadge}>
          <Text style={styles.invEmoji}>{item.emoji}</Text>
        </View>
      </View>
      <View style={styles.invCardBody}>
        <View style={styles.invCardTop}>
          <View style={styles.invTitleArea}>
            <Text style={styles.invTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.invSku}>{item.sku}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{stockStatus}</Text>
          </View>
        </View>
        <Text style={styles.invCategory}>{item.category}</Text>
        <View style={styles.stockBarTrack}>
          <View style={[styles.stockBarFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
        </View>
        <View style={styles.invMetrics}>
          <View style={styles.invMetric}>
            <Text style={styles.invMetricLabel}>In Stock</Text>
            <Text style={[styles.invMetricValue, isLow && { color: statusColor }]}>
              {item.inStock}
              <Text style={styles.invMetricUnit}> / {item.minStock}</Text>
            </Text>
          </View>
          <View style={styles.invMetric}>
            <Text style={styles.invMetricLabel}>Selling Price</Text>
            <Text style={styles.invMetricValue}>{formatPrice(item.sellingPrice)}</Text>
          </View>
          <View style={styles.invMetric}>
            <Text style={styles.invMetricLabel}>Margin</Text>
            <Text style={[styles.invMetricValue, { color: Colors.success }]}>
              {Math.round(((item.sellingPrice - item.costPrice) / item.costPrice) * 100)}%
            </Text>
          </View>
        </View>
        <View style={styles.invActions}>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => onUpdateStock(item.id, -1)}
            >
              <MaterialIcons name="remove" size={14} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.inStock}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => onUpdateStock(item.id, 1)}
            >
              <MaterialIcons name="add" size={14} color={Colors.textMedium} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickEditBtns}>
            <TouchableOpacity style={styles.editBtn}>
              <MaterialIcons name="edit" size={15} color={Colors.primaryGreen} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn}>
              <MaterialIcons name="restart-alt" size={15} color={Colors.primaryGreen} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.invDate}>Last restocked: {item.lastRestocked}</Text>
      </View>
    </View>
  );
}

export default function MyInventoryScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');

  const lowStockItems = useMemo(() => inventory.filter((i) => i.inStock <= i.minStock), [inventory]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  const kpis = useMemo(() => {
    const totalUnits = inventory.reduce((s, i) => s + i.inStock, 0);
    const totalValue = inventory.reduce((s, i) => s + i.sellingPrice * i.inStock, 0);
    return { totalUnits, lowStock: lowStockItems.length, totalValue };
  }, [inventory, lowStockItems]);

  const handleUpdateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, inStock: Math.max(0, i.inStock + delta) } : i
      )
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
          <Text style={styles.kpiValue}>{kpis.totalUnits}</Text>
          <Text style={styles.kpiLabel}>Total Stock</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: lowStockItems.length > 0 ? Colors.warning : Colors.success }]}>
          <Text style={[styles.kpiValue, { color: lowStockItems.length > 0 ? Colors.warning : Colors.success }]}>
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
          placeholder="Search by name, category, or SKU..."
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
  );

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
      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryCard item={item} onUpdateStock={handleUpdateStock} />
        )}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="inventory" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term</Text>
          </View>
        }
      />
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
  quickEditBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    backgroundColor: Colors.primaryGreen + '10',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textLight,
  },
});
