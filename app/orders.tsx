import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Colors } from '../constants/Colors';
import { errorMessage, formatPrice } from '../lib/backend';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: Colors.amber, icon: 'schedule' },
  confirmed: { label: 'Confirmed', color: Colors.primaryGreen, icon: 'check-circle' },
  shipped: { label: 'Shipped', color: Colors.info, icon: 'local-shipping' },
  delivered: { label: 'Delivered', color: Colors.primary, icon: 'verified' },
  cancelled: { label: 'Cancelled', color: Colors.error, icon: 'cancel' },
};

const TABS = ['All', 'Active', 'Completed', 'Cancelled'];

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const orders = useQuery(api.orders.mine);
  const cancelOrder = useMutation(api.orders.cancelMine);

  const filteredOrders = (orders ?? []).filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped';
    if (activeTab === 'Completed') return o.status === 'delivered';
    if (activeTab === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  const handleCancel = (id: string, number: string) => {
    Alert.alert('Cancel order', `Cancel order ${number}? The store hasn't confirmed it yet.`, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder({ id: id as Id<'orders'> });
          } catch (e) {
            Alert.alert('Could not cancel', errorMessage(e));
          }
        },
      },
    ]);
  };

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
      {orders === undefined ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptySub}>Loading your orders…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: order }) => {
            const statusCfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.pending;
            return (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/order-tracking?orderId=${order._id}&code=${order.trackingCode ?? ''}` as any)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdRow}>
                    <Text style={styles.orderId}>{order.number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '18' }]}>
                      <MaterialIcons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                      <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{new Date(order._creationTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.orderItems}>
                  {order.items.map((item) => (
                    <View key={item.productId} style={styles.orderItem}>
                      <Text style={styles.itemEmoji}>📦</Text>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.itemMeta}>{item.quantity} × {formatPrice(item.price)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.vendorLabel}>{order.storeName}</Text>
                    <Text style={styles.totalLabel}>Total: <Text style={styles.totalValue}>{formatPrice(order.total)}</Text></Text>
                  </View>
                  {order.status === 'pending' ? (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(order._id, order.number)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : (
                    <MaterialIcons name="chevron-right" size={22} color={Colors.textLight} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="receipt-long" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySub}>
                {orders.length === 0 ? 'Your orders will appear here after checkout' : 'No orders match this filter'}
              </Text>
              {orders.length === 0 && (
                <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/materials' as any)}>
                  <Text style={styles.browseText}>Browse materials</Text>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
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
  browseBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: Colors.primary,
  },
  browseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
