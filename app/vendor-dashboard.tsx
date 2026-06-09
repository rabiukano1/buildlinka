import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const SALES_DATA = [
  { month: 'Jan', value: 320000 },
  { month: 'Feb', value: 280000 },
  { month: 'Mar', value: 450000 },
  { month: 'Apr', value: 380000 },
  { month: 'May', value: 520000 },
  { month: 'Jun', value: 480000 },
];

const RECENT_ORDERS = [
  { id: 'ORD-101', customer: 'Musa Bello', item: 'Dangote Cement (50kg) x 3', total: 25500, status: 'pending', date: '2 hours ago' },
  { id: 'ORD-102', customer: 'Chioma Ade', item: 'Iron Rod 12mm x 5', total: 34000, status: 'shipped', date: '5 hours ago' },
  { id: 'ORD-103', customer: 'Yakubu Sani', item: 'Ceramic Tiles 60x60 x 2', total: 7000, status: 'delivered', date: '1 day ago' },
  { id: 'ORD-104', customer: 'Folake Ojo', item: 'Emulsion Paint 20L x 1', total: 12500, status: 'pending', date: '1 day ago' },
  { id: 'ORD-105', customer: 'Daniel Eze', item: 'Roofing Sheet x 4', total: 16800, status: 'delivered', date: '3 days ago' },
];

const STOCK_ALERTS = [
  { id: 's1', item: 'Dangote Cement', qty: 4, minQty: 10 },
  { id: 's2', item: 'Iron Rod 12mm', qty: 2, minQty: 8 },
  { id: 's3', item: 'PVC Pipe 3/4"', qty: 0, minQty: 15 },
];

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pending', icon: 'schedule', color: Colors.warning },
  shipped: { label: 'Shipped', icon: 'local-shipping', color: Colors.info },
  delivered: { label: 'Delivered', icon: 'check-circle', color: Colors.success },
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

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const [storeActive, setStoreActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const maxSale = Math.max(...SALES_DATA.map((d) => d.value));

  const analytics = [
    { label: 'Total Sales', value: formatPrice(2450000), icon: 'trending-up', color: Colors.success },
    { label: 'Orders', value: '156', icon: 'receipt-long', color: Colors.primary },
    { label: 'Profile Views', value: '1,892', icon: 'visibility', color: Colors.tertiary },
    { label: 'Rating', value: '4.8', icon: 'star', color: Colors.secondary },
  ];

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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Dashboard</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <View style={[styles.headerStatus, { backgroundColor: storeActive ? 'rgba(76,223,139,0.2)' : 'rgba(255,255,255,0.15)' }]}>
            <View style={[styles.headerStatusDot, { backgroundColor: storeActive ? '#4cdf8b' : Colors.textLight }]} />
            <Text style={styles.headerStatusText}>{storeActive ? 'Open' : 'Closed'}</Text>
          </View>
        </View>

        <View style={styles.headerStore}>
          <View style={styles.headerStoreIcon}>
            <MaterialIcons name="store" size={24} color="#fff" />
          </View>
          <View style={styles.headerStoreInfo}>
            <Text style={styles.headerStoreName}>BuildLinka Supplies</Text>
            <Text style={styles.headerStoreSub}>Premium Construction Materials</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerToggle, storeActive && styles.headerToggleActive]}
            onPress={() => setStoreActive(!storeActive)}
          >
            <View style={[styles.headerToggleKnob, storeActive && styles.headerToggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary, Colors.secondary]} progressBackgroundColor="#fff" />
        }
      >
        {/* ─── Stock Alerts ─── */}
        {STOCK_ALERTS.filter((a) => a.qty <= a.minQty).length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <MaterialIcons name="warning" size={18} color={Colors.error} />
              <Text style={styles.alertTitle}>Critical Stock Alerts</Text>
              <View style={styles.alertCount}>
                <Text style={styles.alertCountText}>{STOCK_ALERTS.length}</Text>
              </View>
            </View>
            {STOCK_ALERTS.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertItemLeft}>
                  <Text style={styles.alertItemName}>{alert.item}</Text>
                  <Text style={styles.alertItemQty}>
                    {alert.qty === 0 ? 'Out of stock' : `${alert.qty} left (min: ${alert.minQty})`}
                  </Text>
                </View>
                <TouchableOpacity style={styles.alertAction} onPress={() => router.push('/add-listing' as any)}>
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

        {/* ─── Sales Trend ─── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Sales Trend</Text>
            <Text style={styles.chartPeriod}>Last 6 months</Text>
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {SALES_DATA.map((d, i) => (
                <View key={d.month} style={styles.barCol}>
                  <AnimatedBar height={d.value} maxHeight={maxSale} delay={i * 80} />
                </View>
              ))}
            </View>
            <View style={styles.barLabels}>
              {SALES_DATA.map((d) => (
                <Text key={d.month} style={styles.barLabel}>{d.month}</Text>
              ))}
            </View>
          </View>
          <View style={styles.chartTotal}>
            <Text style={styles.chartTotalLabel}>Total (6 months)</Text>
            <Text style={styles.chartTotalValue}>{formatPrice(SALES_DATA.reduce((s, d) => s + d.value, 0))}</Text>
          </View>
        </View>

        {/* ─── Recent Orders ─── */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/orders' as any)}>
              <Text style={styles.ordersViewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {RECENT_ORDERS.map((order) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View style={[styles.orderStatus, { backgroundColor: status.color + '15' }]}>
                    <MaterialIcons name={status.icon as any} size={12} color={status.color} />
                    <Text style={[styles.orderStatusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>{order.customer}</Text>
                <Text style={styles.orderItem}>{order.item}</Text>
                <View style={styles.orderBottom}>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Quick Actions ─── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-listing' as any)}>
            <MaterialIcons name="add-circle" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Add Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/my-listings' as any)}>
            <MaterialIcons name="inventory" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/settings' as any)}>
            <MaterialIcons name="settings" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/sales-analytics' as any)}>
            <MaterialIcons name="bar-chart" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
