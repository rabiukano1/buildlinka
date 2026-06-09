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
import { PRODUCTS, CATEGORIES } from '../constants/MockData';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const RECENT_ORDERS = [
  { id: 'ORD-201', item: 'Dangote Cement 42.5R (50kg) x 5', total: 42500, status: 'shipped', date: '2 days ago', emoji: '🏗️' },
  { id: 'ORD-202', item: 'Iron Rod 12mm x 3', total: 20400, status: 'processing', date: '4 days ago', emoji: '⚙️' },
  { id: 'ORD-203', item: 'Ceramic Tiles 60x60 x 10m²', total: 35000, status: 'delivered', date: '1 week ago', emoji: '🏛️' },
];

const ORDER_STATUS: Record<string, { label: string; icon: string; color: string }> = {
  shipped: { label: 'Shipped', icon: 'local-shipping', color: Colors.info },
  processing: { label: 'Processing', icon: 'hourglass-top', color: Colors.warning },
  delivered: { label: 'Delivered', icon: 'check-circle', color: Colors.success },
};

function AnimatedStatBox({ value, label, icon, color, delay }: { value: string; label: string; icon: string; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.statBox, { opacity: anim, transform: [{ scale: anim }] }]}>
      <View style={[styles.statBoxIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statBoxValue}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function BuyerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const topProducts = PRODUCTS.slice(0, 4);

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
          <Text style={styles.headerTitle}>My Dashboard</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/my-cart' as any)}>
            <MaterialIcons name="shopping-cart" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>👤</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerGreeting}>Welcome back!</Text>
            <Text style={styles.headerName}>Dear Customer</Text>
            <Text style={styles.headerTagline}>
              Find materials, hire workers, and track your projects.
            </Text>
          </View>
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
        {/* ─── Quick Stats ─── */}
        <View style={styles.statsGrid}>
          <AnimatedStatBox value="3" label="Active Orders" icon="receipt" color={Colors.primary} delay={0} />
          <AnimatedStatBox value="12" label="Saved Items" icon="bookmark" color={Colors.secondary} delay={100} />
          <AnimatedStatBox value="5" label="Workers Hired" icon="people" color={Colors.tertiary} delay={200} />
          <AnimatedStatBox value="2" label="Projects" icon="construction" color={Colors.info} delay={300} />
        </View>

        {/* ─── Shop by Category ─── */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.slice(0, 8).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryChip}
                onPress={() => router.push(`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}` as any)}
              >
                <MaterialIcons name={cat.icon as any} size={20} color={cat.color} />
                <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Recommended Products ─── */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.viewAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
            {topProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.id}` as any)}
              >
                <View style={styles.productEmojiWrap}>
                  <Text style={styles.productEmoji}>{product.imageEmoji}</Text>
                </View>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}/{product.unit}</Text>
                <View style={styles.productRating}>
                  <MaterialIcons name="star" size={11} color={Colors.warning} />
                  <Text style={styles.productRatingText}>{product.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Recent Orders ─── */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/orders' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {RECENT_ORDERS.map((order) => {
            const status = ORDER_STATUS[order.status] || ORDER_STATUS.processing;
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderCardLeft}>
                  <Text style={styles.orderEmoji}>{order.emoji}</Text>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderItem} numberOfLines={1}>{order.item}</Text>
                    <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[styles.orderStatusBadge, { backgroundColor: status.color + '15' }]}>
                    <MaterialIcons name={status.icon as any} size={11} color={status.color} />
                    <Text style={[styles.orderStatusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Quick Actions ─── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/build-project' as any)}>
            <MaterialIcons name="engineering" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Build</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/my-cart' as any)}>
            <MaterialIcons name="shopping-cart" size={22} color={Colors.secondary} />
            <Text style={styles.quickActionText}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/nearby' as any)}>
            <MaterialIcons name="near-me" size={22} color={Colors.warning} />
            <Text style={styles.quickActionText}>Hire</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/orders' as any)}>
            <MaterialIcons name="receipt" size={22} color={Colors.textMedium} />
            <Text style={styles.quickActionText}>Orders</Text>
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
    paddingBottom: 20,
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
    marginRight: 6,
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
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    lineHeight: 16,
  },

  /* ─── Stats ─── */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
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
  statBoxIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statBoxLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },

  /* ─── Section ─── */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },

  /* ─── Categories ─── */
  categorySection: {
    gap: 10,
  },
  categoryRow: {
    gap: 10,
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ─── Products ─── */
  productsSection: {
    gap: 10,
  },
  productsRow: {
    gap: 12,
    paddingRight: 16,
  },
  productCard: {
    width: 140,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 22,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  productRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },

  /* ─── Orders ─── */
  ordersSection: {
    gap: 10,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  orderEmoji: {
    fontSize: 24,
  },
  orderInfo: {
    flex: 1,
    gap: 2,
  },
  orderItem: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  orderCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 10,
    color: Colors.textLight,
  },

  /* ─── Quick Actions ─── */
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
