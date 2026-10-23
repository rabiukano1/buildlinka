import { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Colors } from '../constants/Colors';
import { formatPrice } from '../lib/backend';

type HistoryOrder = {
  _id: string;
  number: string;
  createdAt: number;
  storeName: string;
  itemsSummary: string;
  total: number;
  status: 'delivered' | 'cancelled';
};

const FILTERS = [
  { key: 'all', label: 'All', icon: 'receipt-long' },
  { key: 'delivered', label: 'Delivered', icon: 'check-circle' },
  { key: 'cancelled', label: 'Cancelled', icon: 'cancel' },
] as const;

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  delivered: { label: 'Delivered', color: Colors.primary, icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: Colors.error, icon: 'cancel' },
};

const monthKey = (t: number) => new Date(t).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const fullDate = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function groupByMonth(orders: HistoryOrder[]) {
  return orders.reduce<Record<string, HistoryOrder[]>>((acc, order) => {
    const month = monthKey(order.createdAt);
    if (!acc[month]) acc[month] = [];
    acc[month].push(order);
    return acc;
  }, {});
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const rows = useQuery(api.orders.mine);

  const history: HistoryOrder[] = useMemo(
    () =>
      (rows ?? [])
        .filter((o) => o.status === 'delivered' || o.status === 'cancelled')
        .map((o) => ({
          _id: o._id,
          number: o.number,
          createdAt: o._creationTime,
          storeName: o.storeName,
          itemsSummary: o.items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
          total: o.total,
          status: o.status as 'delivered' | 'cancelled',
        })),
    [rows]
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return history;
    return history.filter((o) => o.status === activeFilter);
  }, [history, activeFilter]);

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
      {rows === undefined ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptySub}>Loading your history…</Text>
        </View>
      ) : (
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
                    <TouchableOpacity key={order._id} style={styles.timelineItem} activeOpacity={0.8}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.dot, { backgroundColor: meta.color }]}>
                          <View style={[styles.dotInner, { backgroundColor: meta.color }]} />
                        </View>
                        {!isLast && <View style={styles.line} />}
                      </View>
                      <View style={[styles.timelineCard, { borderLeftColor: meta.color }]}>
                        <View style={styles.cardTop}>
                          <Text style={styles.cardEmoji}>📦</Text>
                          <View style={styles.cardMeta}>
                            <Text style={styles.cardId}>{order.number}</Text>
                            <Text style={styles.cardDate}>{fullDate(order.createdAt)}</Text>
                          </View>
                          <View style={[styles.badge, { backgroundColor: meta.color + '18' }]}>
                            <MaterialIcons name={meta.icon as any} size={11} color={meta.color} />
                            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardVendor}>{order.storeName}</Text>
                        <Text style={styles.cardItems} numberOfLines={1}>{order.itemsSummary}</Text>
                        <View style={styles.cardBottom}>
                          <Text style={styles.cardTotal}>{formatPrice(order.total)}</Text>
                          <TouchableOpacity
                            style={styles.reorderBtn}
                            activeOpacity={0.6}
                            onPress={() => router.push('/(tabs)/materials' as any)}
                          >
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

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
