import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

type OrderItem = {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  vendor: string;
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: Colors.amber, icon: 'schedule' },
  confirmed: { label: 'Confirmed', color: Colors.primaryGreen, icon: 'check-circle' },
  shipped: { label: 'Shipped', color: Colors.info, icon: 'local-shipping' },
  delivered: { label: 'Delivered', color: Colors.primary, icon: 'verified' },
  cancelled: { label: 'Cancelled', color: Colors.error, icon: 'cancel' },
};

const ORDERS: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '15 May 2026',
    status: 'delivered',
    vendor: 'Lagos Building Supplies',
    total: 17000,
    items: [
      { id: 'p1', emoji: '🏗️', name: 'Dangote Cement 42.5R (50kg)', qty: 2, price: 8500 },
    ],
  },
  {
    id: 'ORD-2024-002',
    date: '22 May 2026',
    status: 'shipped',
    vendor: 'RoofPro Nigeria',
    total: 4200,
    items: [
      { id: 'p3', emoji: '🏠', name: 'Aluminum Roofing Sheet (0.5mm)', qty: 1, price: 4200 },
    ],
  },
  {
    id: 'ORD-2024-003',
    date: '1 Jun 2026',
    status: 'pending',
    vendor: 'TileWorld Nigeria',
    total: 3500,
    items: [
      { id: 'p5', emoji: '🏛️', name: 'Ceramic Floor Tiles 60x60cm', qty: 1, price: 3500 },
    ],
  },
  {
    id: 'ORD-2024-004',
    date: '5 Jun 2026',
    status: 'confirmed',
    vendor: 'Steel Masters Ltd',
    total: 13600,
    items: [
      { id: 'p4', emoji: '⚙️', name: 'Iron Rod 12mm (6m)', qty: 2, price: 6800 },
    ],
  },
];

const TABS = ['All', 'Active', 'Completed', 'Cancelled'];

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');

  const filteredOrders = ORDERS.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped';
    if (activeTab === 'Completed') return o.status === 'delivered';
    if (activeTab === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'My Orders' }} />
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: order }) => {
          const statusCfg = STATUS_CONFIG[order.status];
          return (
            <TouchableOpacity style={styles.orderCard} activeOpacity={0.85}>
              <View style={styles.orderHeader}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '18' }]}>
                    <MaterialIcons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderItems}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.orderItem}>
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemMeta}>{item.qty} × {formatPrice(item.price)}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.orderFooter}>
                <View>
                  <Text style={styles.vendorLabel}>{order.vendor}</Text>
                  <Text style={styles.totalLabel}>Total: <Text style={styles.totalValue}>{formatPrice(order.total)}</Text></Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors.textLight} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySub}>Your orders will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.surfaceVariant,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 14,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    padding: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  orderItems: {
    padding: 14,
    gap: 10,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  itemMeta: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  vendorLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textLight,
  },
});
