import { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type HistoryOrder = {
  id: string;
  date: string;
  vendor: string;
  emoji: string;
  items: string;
  total: number;
  status: 'delivered' | 'cancelled' | 'returned';
};

const HISTORY: HistoryOrder[] = [
  { id: 'ORD-2024-001', date: '15 May 2026', vendor: 'Lagos Building Supplies', emoji: '🏗️', items: 'Dangote Cement 42.5R (50kg) × 2', total: 17000, status: 'delivered' },
  { id: 'ORD-2024-005', date: '10 Apr 2026', vendor: 'TileWorld Nigeria', emoji: '🏛️', items: 'Ceramic Floor Tiles 60×60cm × 5', total: 17500, status: 'delivered' },
  { id: 'ORD-2024-006', date: '28 Mar 2026', vendor: 'Steel Masters Ltd', emoji: '⚙️', items: 'Iron Rod 12mm (6m) × 3', total: 20400, status: 'delivered' },
  { id: 'ORD-2024-007', date: '15 Mar 2026', vendor: 'RoofPro Nigeria', emoji: '🏠', items: 'Aluminum Roofing Sheet (0.5mm) × 2', total: 8400, status: 'cancelled' },
  { id: 'ORD-2024-008', date: '2 Mar 2026', vendor: 'PlumbShop PH', emoji: '🔧', items: 'PVC Water Pipe 3/4 inch (9m) × 4', total: 11200, status: 'delivered' },
  { id: 'ORD-2024-009', date: '18 Feb 2026', vendor: 'ColourShop Abuja', emoji: '🎨', items: 'Emulsion Paint 20L (White) × 1', total: 12500, status: 'delivered' },
  { id: 'ORD-2024-010', date: '5 Feb 2026', vendor: 'Kano Block Factory', emoji: '🧱', items: 'Sandcrete Block (9 inches) × 50', total: 20000, status: 'returned' },
];

const FILTERS = [
  { key: 'all', label: 'All', icon: 'receipt-long' },
  { key: 'delivered', label: 'Delivered', icon: 'check-circle' },
  { key: 'cancelled', label: 'Cancelled', icon: 'cancel' },
  { key: 'returned', label: 'Returned', icon: 'assignment-return' },
] as const;

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  delivered: { label: 'Delivered', color: Colors.primary, icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: Colors.error, icon: 'cancel' },
  returned: { label: 'Returned', color: Colors.amber, icon: 'assignment-return' },
};

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

function groupByMonth(orders: HistoryOrder[]) {
  return orders.reduce<Record<string, HistoryOrder[]>>((acc, order) => {
    const parts = order.date.split(' ');
    const month = parts[1] + ' ' + parts[2];
    if (!acc[month]) acc[month] = [];
    acc[month].push(order);
    return acc;
  }, {});
}

export default function OrderHistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return HISTORY;
    return HISTORY.filter((o) => o.status === activeFilter);
  }, [activeFilter]);

  const sections = useMemo(() => {
    return Object.entries(groupByMonth(filtered));
  }, [filtered]);

  const stats = useMemo(() => {
    const totalOrders = filtered.length;
    const totalSpent = filtered.reduce((s, o) => s + o.total, 0);
    return { totalOrders, totalSpent };
  }, [filtered]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Order History' }} />
      <FlatList
        data={sections}
        keyExtractor={([month]) => month}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.statsBar}>
              <View style={styles.statCard}>
                <MaterialIcons name="receipt-long" size={18} color={Colors.primary} />
                <Text style={styles.statNumber}>{stats.totalOrders}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <MaterialIcons name="account-balance-wallet" size={18} color={Colors.secondary} />
                <Text style={styles.statNumber}>{formatPrice(stats.totalSpent)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
              {FILTERS.map((f) => {
                const active = activeFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setActiveFilter(f.key)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name={f.icon as any} size={14} color={active ? '#fff' : Colors.textMedium} />
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        }
        renderItem={({ item: [month, orders] }) => (
          <View style={styles.section}>
            <View style={styles.monthRow}>
              <View style={styles.monthAccent} />
              <Text style={styles.monthLabel}>{month}</Text>
            </View>
            <View style={styles.timeline}>
              {orders.map((order, idx) => {
                const meta = STATUS_META[order.status];
                const isLast = idx === orders.length - 1;
                return (
                  <TouchableOpacity key={order.id} style={styles.timelineItem} activeOpacity={0.8}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, { backgroundColor: meta.color }]}>
                        <View style={[styles.dotInner, { backgroundColor: meta.color }]} />
                      </View>
                      {!isLast && <View style={styles.line} />}
                    </View>
                    <View style={[styles.timelineCard, { borderLeftColor: meta.color }]}>
                      <View style={styles.cardTop}>
                        <Text style={styles.cardEmoji}>{order.emoji}</Text>
                        <View style={styles.cardMeta}>
                          <Text style={styles.cardId}>{order.id}</Text>
                          <Text style={styles.cardDate}>{order.date}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: meta.color + '18' }]}>
                          <MaterialIcons name={meta.icon as any} size={11} color={meta.color} />
                          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardVendor}>{order.vendor}</Text>
                      <Text style={styles.cardItems} numberOfLines={1}>{order.items}</Text>
                      <View style={styles.cardBottom}>
                        <Text style={styles.cardTotal}>{formatPrice(order.total)}</Text>
                        <TouchableOpacity style={styles.reorderBtn} activeOpacity={0.6}>
                          <MaterialIcons name="replay" size={13} color="#fff" />
                          <Text style={styles.reorderText}>Reorder</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="search-off" size={44} color={Colors.border} />
            </View>
            <Text style={styles.emptyTitle}>No {activeFilter !== 'all' ? activeFilter : ''} orders</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'all'
                ? 'Completed orders will appear here'
                : `You have no ${activeFilter} orders in your history`}
            </Text>
            {activeFilter !== 'all' && (
              <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setActiveFilter('all')}>
                <Text style={styles.clearFilterText}>Clear filter</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20, paddingBottom: 32 },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.outlineVariant,
  },

  filterRow: {
    marginBottom: 20,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  section: { marginBottom: 24 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  monthAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.primaryGreen,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
    letterSpacing: 0.3,
  },

  timeline: {},
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: Colors.primaryGreen,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.outlineVariant,
    marginTop: 2,
  },

  timelineCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginLeft: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardEmoji: { fontSize: 22 },
  cardMeta: { flex: 1 },
  cardId: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  cardDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardVendor: {
    fontSize: 11,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  cardItems: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGreen,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  reorderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
});
