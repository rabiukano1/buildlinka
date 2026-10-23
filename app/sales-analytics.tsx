import { Component, useMemo, useRef, useEffect, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { formatPrice } from '../lib/backend';
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
      <Text style={styles.emptySub}>
        You need a vendor store before you can see sales analytics.
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

function AnimatedChartBar({ height, maxHeight, delay }: { height: number; maxHeight: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const barH = maxHeight > 0 ? (height / maxHeight) * 160 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.chartBar,
        {
          height: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, barH],
          }),
        },
      ]}
    />
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconBox, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

function AnalyticsBody() {
  const stats = useQuery(api.orders.myStoreStats);

  const maxRevenue = useMemo(
    () => Math.max(...(stats?.salesByMonth.map((d) => d.total) ?? [0]), 1),
    [stats]
  );

  if (stats === undefined) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.emptySub}>Loading analytics…</Text>
      </View>
    );
  }

  const months = stats.salesByMonth;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Revenue Section (real monthly sales) ─── */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <View>
            <Text style={styles.revenuePeriod}>Total sales</Text>
            <Text style={styles.revenueValue}>{formatPrice(stats.totalSales)}</Text>
          </View>
          <View style={styles.revenueGrowth}>
            <MaterialIcons name="receipt-long" size={18} color={Colors.success} />
            <Text style={styles.revenueGrowthText}>{stats.orderCount} orders</Text>
          </View>
        </View>
        {months.length === 0 ? (
          <Text style={styles.emptySub}>No sales yet. Your monthly sales chart will appear here.</Text>
        ) : (
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {months.map((d, i) => (
                <View key={d.month} style={styles.barCol}>
                  <AnimatedChartBar
                    height={d.total}
                    maxHeight={maxRevenue}
                    delay={i * 80}
                  />
                </View>
              ))}
            </View>
            <View style={styles.barLabels}>
              {months.map((d) => (
                <Text key={d.month} style={styles.barLabel}>{d.month.slice(5)}</Text>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ─── KPI Grid (real numbers only) ─── */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.kpiGrid}>
        <KpiCard
          icon="trending-up"
          label="Total Sales"
          value={formatPrice(stats.totalSales)}
          sub={`${stats.orderCount} orders counted`}
          color={Colors.success}
        />
        <KpiCard
          icon="shopping-cart"
          label="Total Orders"
          value={String(stats.orderCount)}
          sub={`${stats.openOrders} open`}
          color={Colors.primary}
        />
        <KpiCard
          icon="inventory-2"
          label="Live Products"
          value={String(stats.productCount)}
          color={Colors.tertiary}
        />
        <KpiCard
          icon="warning"
          label="Low Stock"
          value={String(stats.lowStock.length)}
          sub="items at or below minimum"
          color={Colors.secondary}
        />
      </View>

      {/* ─── Low Stock ─── */}
      <Text style={styles.sectionTitle}>Needs Restocking</Text>
      {stats.lowStock.length === 0 ? (
        <View style={styles.bestProductsCard}>
          <Text style={styles.allStocked}>All stocked up — nothing at or below minimum.</Text>
        </View>
      ) : (
        <View style={styles.bestProductsCard}>
          {stats.lowStock.map((p, i) => (
            <View key={p._id} style={styles.bestProductRow}>
              <View style={styles.bestRank}>
                <Text style={styles.bestRankText}>{i + 1}</Text>
              </View>
              <Text style={styles.bestEmoji}>📦</Text>
              <View style={styles.bestInfo}>
                <Text style={styles.bestName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.bestUnits}>{p.stock} {p.unit} left (min {p.minStock})</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function SalesAnalyticsScreen() {
  const me = useQuery(api.users.me);

  if (me === undefined) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Sales Analytics',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Sales Analytics',
          headerBackTitle: 'Back',
          headerTintColor: Colors.primary,
        }}
      />
      {!me?.store ? (
        <NoStoreState />
      ) : (
        <StoreErrorBoundary>
          <AnalyticsBody />
        </StoreErrorBoundary>
      )}
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
    paddingBottom: 32,
    gap: 16,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },

  /* ─── Revenue ─── */
  revenueCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  revenuePeriod: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  revenueValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textDark,
    marginTop: 2,
  },
  revenueGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '10',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  revenueGrowthText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  chartContainer: {
    height: 180,
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
  chartBar: {
    width: 22,
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

  /* ─── Section ─── */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },

  /* ─── KPI Grid ─── */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 1,
  },

  /* ─── Low stock list ─── */
  bestProductsCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: Colors.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  allStocked: {
    fontSize: 13,
    color: Colors.textMedium,
    padding: 16,
  },
  bestProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  bestRank: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  bestEmoji: {
    fontSize: 22,
  },
  bestInfo: {
    flex: 1,
    gap: 1,
  },
  bestName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  bestUnits: {
    fontSize: 10,
    color: Colors.textLight,
  },

  /* ─── Empty ─── */
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingHorizontal: 8 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.primary, marginTop: 8 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
});
