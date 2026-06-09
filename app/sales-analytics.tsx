import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');
const formatCount = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

const TIMEFRAMES = ['Day', 'Week', 'Month', 'Year'] as const;
type Timeframe = typeof TIMEFRAMES[number];

const REVENUE_DATA: Record<Timeframe, { label: string; value: number }[]> = {
  Day: [
    { label: '6AM', value: 12000 },
    { label: '9AM', value: 45000 },
    { label: '12PM', value: 62000 },
    { label: '3PM', value: 38000 },
    { label: '6PM', value: 55000 },
    { label: '9PM', value: 28000 },
  ],
  Week: [
    { label: 'Mon', value: 180000 },
    { label: 'Tue', value: 145000 },
    { label: 'Wed', value: 220000 },
    { label: 'Thu', value: 195000 },
    { label: 'Fri', value: 280000 },
    { label: 'Sat', value: 320000 },
    { label: 'Sun', value: 120000 },
  ],
  Month: [
    { label: 'Wk 1', value: 980000 },
    { label: 'Wk 2', value: 1120000 },
    { label: 'Wk 3', value: 850000 },
    { label: 'Wk 4', value: 1350000 },
  ],
  Year: [
    { label: 'Jan', value: 520000 },
    { label: 'Feb', value: 480000 },
    { label: 'Mar', value: 750000 },
    { label: 'Apr', value: 680000 },
    { label: 'May', value: 920000 },
    { label: 'Jun', value: 880000 },
    { label: 'Jul', value: 1050000 },
    { label: 'Aug', value: 980000 },
    { label: 'Sep', value: 1120000 },
    { label: 'Oct', value: 1250000 },
    { label: 'Nov', value: 1180000 },
    { label: 'Dec', value: 1420000 },
  ],
};

const BEST_PRODUCTS = [
  { rank: 1, name: 'Dangote Cement 42.5R (50kg)', emoji: '🏗️', units: 342, revenue: 2907000 },
  { rank: 2, name: 'Ceramic Floor Tiles 60x60cm', emoji: '🏛️', units: 198, revenue: 693000 },
  { rank: 3, name: 'Iron Rod 12mm (6m)', emoji: '⚙️', units: 156, revenue: 1060800 },
  { rank: 4, name: 'Emulsion Paint 20L (White)', emoji: '🎨', units: 89, revenue: 1112500 },
  { rank: 5, name: 'Aluminum Roofing Sheet 0.5mm', emoji: '🏠', units: 72, revenue: 302400 },
];

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

export default function SalesAnalyticsScreen() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('Month');

  const revenueData = REVENUE_DATA[timeframe];
  const maxRevenue = useMemo(() => Math.max(...revenueData.map((d) => d.value)), [revenueData]);
  const totalRevenue = useMemo(() => revenueData.reduce((s, d) => s + d.value, 0), [revenueData]);

  const periodLabel = timeframe === 'Day' ? 'Today' : `This ${timeframe.toLowerCase()}`;

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Timeframe Filters ─── */}
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeChip, timeframe === tf && styles.timeframeChipActive]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Revenue Section ─── */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View>
              <Text style={styles.revenuePeriod}>{periodLabel}</Text>
              <Text style={styles.revenueValue}>{formatPrice(totalRevenue)}</Text>
            </View>
            <View style={styles.revenueGrowth}>
              <MaterialIcons name="trending-up" size={18} color={Colors.success} />
              <Text style={styles.revenueGrowthText}>+12.5%</Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
              {revenueData.map((d, i) => (
                <View key={d.label} style={styles.barCol}>
                  <AnimatedChartBar
                    height={d.value}
                    maxHeight={maxRevenue}
                    delay={i * 80}
                  />
                </View>
              ))}
            </View>
            <View style={styles.barLabels}>
              {revenueData.map((d) => (
                <Text key={d.label} style={styles.barLabel}>{d.label}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* ─── KPI Grid ─── */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="trending-up"
            label="Total Revenue"
            value={formatPrice(11450000)}
            sub="Last 30 days"
            color={Colors.success}
          />
          <KpiCard
            icon="shopping-cart"
            label="Total Orders"
            value="156"
            sub="24 pending"
            color={Colors.primary}
          />
          <KpiCard
            icon="people"
            label="Total Customers"
            value="89"
            sub="12 new this month"
            color={Colors.tertiary}
          />
          <KpiCard
            icon="star"
            label="Avg. Rating"
            value="4.8"
            sub="From 312 reviews"
            color={Colors.secondary}
          />
        </View>

        {/* ─── Conversion & Customer Insights ─── */}
        <Text style={styles.sectionTitle}>Customer Insights</Text>
        <View style={styles.insightsRow}>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Conversion Rate</Text>
            <View style={styles.insightValueRow}>
              <Text style={styles.insightValue}>3.8%</Text>
              <View style={styles.insightChange}>
                <MaterialIcons name="arrow-upward" size={12} color={Colors.success} />
                <Text style={styles.insightChangeText}>+0.6%</Text>
              </View>
            </View>
            <View style={styles.insightBar}>
              <View style={[styles.insightBarFill, { width: '38%' }]} />
            </View>
            <Text style={styles.insightSub}>1,892 visits → 72 orders</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>New vs. Repeat</Text>
            <View style={styles.donutRow}>
              <View style={styles.donutSegment}>
                <View style={[styles.donutCircle, { borderColor: Colors.primaryGreen, borderWidth: 4 }]}>
                  <Text style={styles.donutPct}>62%</Text>
                </View>
                <Text style={styles.donutLabel}>New</Text>
              </View>
              <View style={styles.donutSegment}>
                <View style={[styles.donutCircle, { borderColor: Colors.secondary, borderWidth: 4 }]}>
                  <Text style={styles.donutPct}>38%</Text>
                </View>
                <Text style={styles.donutLabel}>Repeat</Text>
              </View>
            </View>
            <Text style={styles.insightSub}>55 new, 34 returning customers</Text>
          </View>
        </View>

        {/* ─── Best Selling Products ─── */}
        <Text style={styles.sectionTitle}>Best Selling Products</Text>
        <View style={styles.bestProductsCard}>
          {BEST_PRODUCTS.map((p) => (
            <View key={p.rank} style={styles.bestProductRow}>
              <View style={styles.bestRank}>
                <Text style={styles.bestRankText}>{p.rank}</Text>
              </View>
              <Text style={styles.bestEmoji}>{p.emoji}</Text>
              <View style={styles.bestInfo}>
                <Text style={styles.bestName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.bestUnits}>{p.units} units sold</Text>
              </View>
              <Text style={styles.bestRevenue}>{formatPrice(p.revenue)}</Text>
            </View>
          ))}
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
    paddingBottom: 32,
    gap: 16,
  },

  /* ─── Timeframe ─── */
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 99,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 99,
    alignItems: 'center',
  },
  timeframeChipActive: {
    backgroundColor: Colors.primary,
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  timeframeTextActive: {
    color: '#fff',
    fontWeight: '700',
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

  /* ─── Insights ─── */
  insightsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  insightCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  insightLabel: {
    fontSize: 11,
    color: Colors.textMedium,
    fontWeight: '600',
  },
  insightValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textDark,
  },
  insightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  insightChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  insightBar: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  insightBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryGreen,
    borderRadius: 3,
  },
  insightSub: {
    fontSize: 10,
    color: Colors.textLight,
  },
  donutRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  donutSegment: {
    alignItems: 'center',
    gap: 4,
  },
  donutCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  donutPct: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  donutLabel: {
    fontSize: 10,
    color: Colors.textMedium,
    fontWeight: '600',
  },

  /* ─── Best Products ─── */
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
  bestRevenue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryGreen,
  },
});
