import { Component, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { formatPrice, goBackOrHome } from '../lib/backend';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

/** Shown when the signed-in user has no store yet (store queries throw then). */
function NoStoreState() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.centerWrap, { paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="store" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Create your store first</Text>
      <Text style={styles.emptySub}>
        You need a vendor store before you can see your dashboard, inventory and orders.
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

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pending', icon: 'schedule', color: Colors.warning },
  confirmed: { label: 'Confirmed', icon: 'check-circle', color: Colors.info },
  shipped: { label: 'Shipped', icon: 'local-shipping', color: Colors.info },
  delivered: { label: 'Delivered', icon: 'check-circle', color: Colors.success },
  cancelled: { label: 'Cancelled', icon: 'cancel', color: Colors.error },
};

function AnimatedBar({ height, maxHeight, delay }: { height: number; maxHeight: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const barHeight = maxHeight > 0 ? (height / maxHeight) * 120 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.bar, { height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, barHeight] }) }]} />
  );
}

function DashboardBody() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useQuery(api.orders.myStoreStats);
  const storeOrders = useQuery(api.orders.forMyStore);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  if (stats === undefined || storeOrders === undefined) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.emptySub}>Loading your store…</Text>
      </View>
    );
  }

  const recentOrders = storeOrders.slice(0, 5);
  const lowStock = stats.lowStock;
  const months = stats.salesByMonth;
  const maxSale = Math.max(...months.map((d) => d.total), 1);

  const analytics = [
    { label: 'Total Sales', value: formatPrice(stats.totalSales), icon: 'trending-up', color: Colors.success },
    { label: 'Orders', value: String(stats.orderCount), icon: 'receipt-long', color: Colors.primary },
    { label: 'Open Orders', value: String(stats.openOrders), icon: 'hourglass-top', color: Colors.tertiary },
    { label: 'Live Products', value: String(stats.productCount), icon: 'inventory-2', color: Colors.secondary },
  ];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary, Colors.secondary]} progressBackgroundColor="#fff" />
      }
    >
      {/* ─── Stock Alerts (real low-stock products) ─── */}
      {lowStock.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <MaterialIcons name="warning" size={18} color={Colors.error} />
            <Text style={styles.alertTitle}>Low Stock Alerts</Text>
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{lowStock.length}</Text>
            </View>
          </View>
          {lowStock.slice(0, 5).map((alert) => (
            <View key={alert._id} style={styles.alertItem}>
              <View style={styles.alertItemLeft}>
                <Text style={styles.alertItemName}>{alert.name}</Text>
                <Text style={styles.alertItemQty}>
                  {alert.stock === 0 ? 'Out of stock' : `${alert.stock} ${alert.unit} left (min: ${alert.minStock})`}
                </Text>
              </View>
              <TouchableOpacity style={styles.alertAction} onPress={() => router.push('/my-inventory' as any)}>
                <Text style={styles.alertActionText}>Restock</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ─── Analytics Grid ─── */}
      <View style={styles.analyticsGrid}>
        {analytics.map((item, i) => (
          <View key={i} style={styles.analyticCard}>
            <View style={[styles.analyticIcon, { backgroundColor: item.color + '15' }]}>
              <MaterialIcons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.analyticValue}>{item.value}</Text>
            <Text style={styles.analyticLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ─── Sales Trend (real monthly sales) ─── */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Sales Trend</Text>
          <Text style={styles.chartPeriod}>Last {months.length || 0} months</Text>
        </View>
        {months.length === 0 ? (
          <Text style={styles.emptySub}>No sales yet. Your monthly sales will appear here.</Text>
        ) : (
          <>
            <View style={styles.chartContainer}>
              <View style={styles.barsRow}>
                {months.map((d, i) => (
                  <View key={d.month} style={styles.barCol}>
                    <AnimatedBar height={d.total} maxHeight={maxSale} delay={i * 80} />
                  </View>
                ))}
              </View>
              <View style={styles.barLabels}>
                {months.map((d) => (
                  <Text key={d.month} style={styles.barLabel}>{d.month.slice(5)}</Text>
                ))}
              </View>
            </View>
            <View style={styles.chartTotal}>
              <Text style={styles.chartTotalLabel}>Total</Text>
              <Text style={styles.chartTotalValue}>{formatPrice(stats.totalSales)}</Text>
            </View>
          </>
        )}
      </View>

      {/* ─── Recent Orders ─── */}
      <View style={styles.ordersSection}>
        <View style={styles.ordersHeader}>
          <Text style={styles.ordersTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/orders' as any)}>
            <Text style={styles.ordersViewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.length === 0 ? (
          <View style={styles.chartCard}>
            <Text style={styles.emptySub}>No orders yet. New orders from customers will appear here.</Text>
          </View>
        ) : (
          recentOrders.map((order) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const firstItem = order.items[0];
            return (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderId}>{order.number}</Text>
                  <View style={[styles.orderStatus, { backgroundColor: status.color + '15' }]}>
                    <MaterialIcons name={status.icon as any} size={12} color={status.color} />
                    <Text style={[styles.orderStatusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>{order.buyerName}</Text>
                <Text style={styles.orderItem}>
                  {firstItem ? `${firstItem.name} x ${firstItem.quantity}` : `${order.items.length} items`}
                </Text>
                <View style={styles.orderBottom}>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  <Text style={styles.orderDate}>{new Date(order._creationTime).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ─── Quick Actions ─── */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-listing' as any)}>
          <MaterialIcons name="add-circle" size={22} color={Colors.primary} />
          <Text style={styles.quickActionText}>Add Listing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/my-inventory' as any)}>
          <MaterialIcons name="inventory" size={22} color={Colors.primary} />
          <Text style={styles.quickActionText}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/settings?role=vendor' as any)}>
          <MaterialIcons name="settings" size={22} color={Colors.primary} />
          <Text style={styles.quickActionText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/sales-analytics' as any)}>
          <MaterialIcons name="bar-chart" size={22} color={Colors.primary} />
          <Text style={styles.quickActionText}>Analytics</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const me = useQuery(api.users.me);
  const setOpen = useMutation(api.stores.update);
  const [toggleError, setToggleError] = useState<string | null>(null);

  if (me === undefined) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }
  if (!me?.store) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <NoStoreState />
      </View>
    );
  }

  const storeOpen = me.store.isOpen;

  const toggleStore = async () => {
    setToggleError(null);
    try {
      await setOpen({ isOpen: !storeOpen });
    } catch {
      setToggleError('Could not update your store. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primary, '#0a5215', Colors.primaryContainer]}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => goBackOrHome()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Dashboard</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <View style={[styles.headerStatus, { backgroundColor: storeOpen ? 'rgba(76,223,139,0.2)' : 'rgba(255,255,255,0.15)' }]}>
            <View style={[styles.headerStatusDot, { backgroundColor: storeOpen ? '#4cdf8b' : Colors.textLight }]} />
            <Text style={styles.headerStatusText}>{storeOpen ? 'Open' : 'Closed'}</Text>
          </View>
        </View>

        <View style={styles.headerStore}>
          <View style={styles.headerStoreIcon}>
            <MaterialIcons name="store" size={24} color="#fff" />
          </View>
          <View style={styles.headerStoreInfo}>
            <Text style={styles.headerStoreName}>{me.store.name}</Text>
            <Text style={styles.headerStoreSub} numberOfLines={1}>{me.store.location}</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerToggle, storeOpen && styles.headerToggleActive]}
            onPress={toggleStore}
            accessibilityLabel="Toggle store open"
          >
            <View style={[styles.headerToggleKnob, storeOpen && styles.headerToggleKnobActive]} />
          </TouchableOpacity>
        </View>
        {toggleError && <Text style={styles.headerError}>{toggleError}</Text>}
      </LinearGradient>

      <StoreErrorBoundary>
        <DashboardBody />
      </StoreErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingTop: 12,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },

  /* ─── Header ─── */
  headerWrap: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  notifBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  headerStore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 14,
  },
  headerStoreIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStoreInfo: {
    flex: 1,
    gap: 1,
  },
  headerStoreName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  headerStoreSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerToggleActive: {
    backgroundColor: '#4cdf8b',
  },
  headerToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  headerError: {
    fontSize: 12,
    color: '#ffd7d7',
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  /* ─── Stock Alerts ─── */
  alertCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  alertCount: {
    backgroundColor: Colors.error,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  alertCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  alertItemLeft: {
    flex: 1,
    gap: 2,
  },
  alertItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  alertItemQty: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '500',
  },
  alertAction: {
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  alertActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ─── Analytics Grid ─── */
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  analyticCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analyticIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  analyticLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },

  /* ─── Chart ─── */
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  chartPeriod: {
    fontSize: 11,
    color: Colors.textLight,
  },
  chartContainer: {
    height: 150,
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  chartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  chartTotalLabel: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  chartTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },

  /* ─── Recent Orders ─── */
  ordersSection: {
    gap: 10,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ordersTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  ordersViewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 2,
  },
  orderItem: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textLight,
  },

  /* ─── Quick Actions ─── */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },

  /* ─── Empty state ─── */
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.primary, marginTop: 8 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
  errorText: { fontSize: 13, color: Colors.error, textAlign: 'center' },
});
