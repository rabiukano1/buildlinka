import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { WORKERS, TRADES } from '../constants/MockData';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';

const { width, height } = Dimensions.get('window');

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const NEARBY_WORKERS = WORKERS.map((w, i) => ({
  ...w,
  distance: +(0.3 + i * 0.7).toFixed(1),
}));

const NEARBY_JOBS = [
  { id: 'nj1', title: 'Block Laying Needed', client: 'Mr. Adebayo O.', location: 'Ikeja, Lagos', distance: 0.8, budget: 120000, trade: 'Mason', duration: '2 weeks', urgent: true },
  { id: 'nj2', title: 'Full House Wiring', client: 'Mrs. Chioma E.', location: 'Surulere, Lagos', distance: 1.2, budget: 250000, trade: 'Electrician', duration: '1 week', urgent: false },
  { id: 'nj3', title: 'Bathroom Plumbing', client: 'Alh. Musa B.', location: 'Victoria Island', distance: 2.5, budget: 85000, trade: 'Plumber', duration: '3 days', urgent: true },
  { id: 'nj4', title: 'Roofing Installation', client: 'Eng. Ibrahim S.', location: 'Lekki, Lagos', distance: 3.1, budget: 350000, trade: 'Carpenter', duration: '1 month', urgent: false },
  { id: 'nj5', title: 'Tiling - 3 Bedroom Flat', client: 'Folake Ojo', location: 'Gbagada, Lagos', distance: 4.0, budget: 180000, trade: 'Tiler', duration: '1 week', urgent: false },
  { id: 'nj6', title: 'Interior Painting', client: 'Daniel Eze', location: 'Yaba, Lagos', distance: 1.8, budget: 95000, trade: 'Painter', duration: '4 days', urgent: true },
];

const TRADE_ICONS: Record<string, string> = {
  Mason: '🧱',
  Electrician: '⚡',
  Plumber: '🔧',
  Carpenter: '🪚',
  Painter: '🎨',
  Welder: '⚙️',
  Tiler: '🏛️',
  Designer: '📐',
};

const TRADE_COLORS: Record<string, string> = {
  Mason: '#8B4513',
  Electrician: '#DAA520',
  Plumber: '#4682B4',
  Carpenter: '#CD853F',
  Painter: '#9370DB',
  Welder: '#708090',
  Tiler: '#20B2AA',
  Designer: '#DB7093',
};

const getDistanceColor = (km: number) => {
  if (km <= 1) return '#0d631b';
  if (km <= 2) return '#2e7d32';
  if (km <= 3) return '#6d5100';
  return '#a83900';
};

const getDistanceLabel = (km: number) => {
  if (km <= 1) return 'Very close';
  if (km <= 2) return 'Nearby';
  if (km <= 3) return 'Fair distance';
  return 'Further away';
};

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.8, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.pulseDotWrap}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }] }]} />
      <View style={styles.pulseCore} />
    </View>
  );
}

function MapDecoration() {
  return (
    <View style={styles.mapDecor}>
      <View style={styles.mapInner}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.gridDot,
              {
                opacity: 0.08 + (i % 7) * 0.025,
                left: (Math.random() * 85 + 5) as any,
                top: (Math.random() * 70 + 10) as any,
              },
            ]}
          />
        ))}
        <View style={styles.curvedLine1} />
        <View style={styles.curvedLine2} />
        <PulseDot />
        <View style={styles.mapSecondaryPin}>
          <View style={styles.secondaryPinInner}>
            <MaterialIcons name="people" size={12} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
        <View style={[styles.mapSecondaryPin, styles.mapThirdPin]}>
          <View style={styles.secondaryPinInner}>
            <MaterialIcons name="work" size={11} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>
    </View>
  );
}

function DistanceRing({ km, size = 38 }: { km: number; size?: number }) {
  const quarter = size / 4;
  const maxKm = 5;
  const pct = Math.min(km / maxKm, 1);
  const color = getDistanceColor(km);
  const borderW = 3;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: size / 2, borderWidth: borderW, borderColor: Colors.divider,
      }} />
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: size / 2, borderWidth: borderW, borderColor: 'transparent',
        borderTopColor: pct > 0 ? color : 'transparent',
        borderRightColor: pct > 0.25 ? color : 'transparent',
        borderBottomColor: pct > 0.5 ? color : 'transparent',
        borderLeftColor: pct > 0.75 ? color : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }} />
      <MaterialIcons name="near-me" size={size * 0.38} color={color} />
    </View>
  );
}

function WorkerNearbyCard({ worker, index }: { worker: typeof NEARBY_WORKERS[0]; index: number }) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const anim = useRef(new Animated.Value(0)).current;
  const distanceColor = getDistanceColor(worker.distance);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 70, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, friction: 6, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start()}
        style={styles.cardInner}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardAvatarWrap}>
            <LinearGradient
              colors={[Colors.primary + '12', Colors.primary + '05']}
              style={styles.cardAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.cardAvatarText}>{worker.avatar}</Text>
            </LinearGradient>
            <View style={[styles.cardAvailDot, { backgroundColor: worker.available ? '#22c55e' : Colors.textMuted }]} />
            <View style={[styles.distanceRingBadge, { backgroundColor: distanceColor + '12', borderColor: distanceColor + '30' }]}>
              <MaterialIcons name="near-me" size={10} color={distanceColor} />
              <Text style={[styles.distanceRingText, { color: distanceColor }]}>{worker.distance} km</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardName}>{worker.name}</Text>
              {worker.available && <View style={styles.availChip}><Text style={styles.availChipText}>Available</Text></View>}
            </View>
            <Text style={styles.cardTrade}>{worker.trade}</Text>
            <View style={styles.cardMeta}>
              <MaterialIcons name="star" size={12} color="#f5a623" />
              <Text style={styles.cardRating}>{worker.rating}</Text>
              <View style={styles.metaDot} />
              <MaterialIcons name="work" size={11} color={Colors.textLight} />
              <Text style={styles.cardExp}>{worker.experience} yrs</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardRate}>{formatPrice(worker.dailyRate)}</Text>
          <Text style={styles.cardRateLabel}>per day</Text>
          <TouchableOpacity style={styles.cardHireBtn}>
            <Text style={styles.cardHireText}>Hire</Text>
            <MaterialIcons name="arrow-forward" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function JobNearbyCard({ job, index }: { job: typeof NEARBY_JOBS[0]; index: number }) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const anim = useRef(new Animated.Value(0)).current;
  const distanceColor = getDistanceColor(job.distance);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 70, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.jobCard, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, friction: 6, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start()}
      >
        <View style={styles.jobTop}>
          <LinearGradient
            colors={[distanceColor + '12', distanceColor + '05']}
            style={styles.jobIconWrap}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.jobIcon}>{TRADE_ICONS[job.trade] || '🛠️'}</Text>
          </LinearGradient>
          <View style={styles.jobInfo}>
            <View style={styles.jobTitleRow}>
              <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
              {job.urgent && (
                <View style={styles.urgentBadge}>
                  <MaterialIcons name="bolt" size={9} color={Colors.error} />
                  <Text style={styles.urgentText}>Urgent</Text>
                </View>
              )}
            </View>
            <Text style={styles.jobClient}>{job.client}</Text>
            <View style={styles.jobMeta}>
              <View style={[styles.jobDistanceBadge, { backgroundColor: distanceColor + '12' }]}>
                <MaterialIcons name="near-me" size={10} color={distanceColor} />
                <Text style={[styles.jobDistanceText, { color: distanceColor }]}>{job.distance} km</Text>
              </View>
              <View style={styles.metaDot} />
              <MaterialIcons name="location-on" size={11} color={Colors.textLight} />
              <Text style={styles.jobLocation}>{job.location}</Text>
            </View>
          </View>
        </View>
        <View style={styles.jobBottom}>
          <View style={styles.jobBudgetWrap}>
            <Text style={styles.jobBudgetLabel}>Budget</Text>
            <Text style={styles.jobBudget}>{formatPrice(job.budget)}</Text>
          </View>
          <View style={styles.jobRight}>
            <Text style={styles.jobDuration}>{job.duration}</Text>
            <TouchableOpacity style={styles.jobApplyBtn}>
              <Text style={styles.jobApplyText}>Apply</Text>
              <MaterialIcons name="arrow-forward" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NearbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'workers' | 'jobs'>('workers');
  const [search, setSearch] = useState('');
  const [filterTrade, setFilterTrade] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, friction: 10, tension: 50, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(tabAnim, { toValue: tab === 'workers' ? 0 : 1, friction: 12, tension: 80, useNativeDriver: false }).start();
  }, [tab]);

  const filteredWorkers = NEARBY_WORKERS.filter((w) => {
    const q = search.toLowerCase();
    const matchesSearch = w.name.toLowerCase().includes(q) || w.trade.toLowerCase().includes(q) || w.location.toLowerCase().includes(q);
    const matchesTrade = filterTrade === 'All' || w.trade === filterTrade;
    return matchesSearch && matchesTrade;
  });

  const filteredJobs = NEARBY_JOBS.filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch = j.title.toLowerCase().includes(q) || j.trade.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    const matchesTrade = filterTrade === 'All' || j.trade === filterTrade;
    return matchesSearch && matchesTrade;
  });

  const counts = tab === 'workers' ? filteredWorkers.length : filteredJobs.length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#0d631b', '#0a5215', '#063d0e']}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.2 }}
      >
        <Animated.View style={{ opacity: headerAnim }}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleArea}>
              <Text style={styles.headerTitle}>Find Nearby</Text>
              <Text style={styles.headerSub}>Workers & jobs around you</Text>
            </View>
            <TouchableOpacity style={styles.filterFab} activeOpacity={0.7}>
              <MaterialIcons name="tune" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <MapDecoration />

        <Animated.View style={[styles.searchWrap, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={styles.searchInput}
              placeholder={tab === 'workers' ? 'Search workers by name, trade...' : 'Search jobs by title, trade...'}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
                <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.tabRow}>
        <View style={styles.tabBg}>
          <Animated.View
            style={[
              styles.tabSlider,
              { left: tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] }) },
            ]}
          />
          <TouchableOpacity style={styles.tab} onPress={() => setTab('workers')} activeOpacity={0.7}>
            <MaterialIcons name="people" size={17} color={tab === 'workers' ? '#fff' : Colors.textLight} />
            <Text style={[styles.tabText, tab === 'workers' && styles.tabTextActive]}>Workers</Text>
            <View style={[styles.tabPill, tab === 'workers' && styles.tabPillActive]}>
              <Text style={[styles.tabPillText, tab === 'workers' && styles.tabPillTextActive]}>{NEARBY_WORKERS.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setTab('jobs')} activeOpacity={0.7}>
            <MaterialIcons name="work" size={17} color={tab === 'jobs' ? '#fff' : Colors.textLight} />
            <Text style={[styles.tabText, tab === 'jobs' && styles.tabTextActive]}>Jobs</Text>
            <View style={[styles.tabPill, tab === 'jobs' && styles.tabPillActive]}>
              <Text style={[styles.tabPillText, tab === 'jobs' && styles.tabPillTextActive]}>{NEARBY_JOBS.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterContainer}
      >
        {['All', ...TRADES.filter((t) => t !== 'All')].map((trade) => (
          <TouchableOpacity
            key={trade}
            style={[styles.filterChip, filterTrade === trade && styles.filterChipActive]}
            onPress={() => setFilterTrade(trade)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipEmoji}>{trade === 'All' ? '📍' : TRADE_ICONS[trade]}</Text>
            <Text style={[styles.filterChipText, filterTrade === trade && styles.filterChipTextActive]}>{trade}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAwareWrapper
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControlComponent refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        <Animated.View style={[styles.resultsHeader, { opacity: headerAnim }]}>
          <View style={styles.resultsCountWrap}>
            <Text style={styles.resultsCount}>
              {counts} {tab === 'workers' ? 'worker' : 'job'}{counts !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.resultsSub}>found near you</Text>
          </View>
          <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
            <MaterialIcons name="sort" size={16} color={Colors.textMedium} />
            <Text style={styles.sortText}>Nearest</Text>
          </TouchableOpacity>
        </Animated.View>

        {tab === 'workers' && filteredWorkers.map((w, i) => <WorkerNearbyCard key={w.id} worker={w} index={i} />)}
        {tab === 'jobs' && filteredJobs.map((j, i) => <JobNearbyCard key={j.id} job={j} index={i} />)}

        {tab === 'workers' && filteredWorkers.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="people-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No workers found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={() => { setSearch(''); setFilterTrade('All'); }}>
              <Text style={styles.emptyCtaText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
        {tab === 'jobs' && filteredJobs.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="work-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No jobs nearby</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={() => { setSearch(''); setFilterTrade('All'); }}>
              <Text style={styles.emptyCtaText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareWrapper>
    </View>
  );
}

function RefreshControlComponent({ refreshing, onRefresh, ...props }: any) {
  const ScrollViewRefresh = require('react-native').RefreshControl;
  return <ScrollViewRefresh refreshing={refreshing} onRefresh={onRefresh} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3f0',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingTop: 4 },

  /* ─── Header ─── */
  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1, fontWeight: '500' },
  filterFab: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  /* ─── Map Decor ─── */
  mapDecor: {
    marginHorizontal: 16,
    marginTop: 6,
    height: 96,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapInner: { flex: 1, position: 'relative' },
  gridDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#fff',
  },
  curvedLine1: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1,
    transform: [{ rotate: '-8deg' }],
  },
  curvedLine2: {
    position: 'absolute',
    top: '58%',
    left: '20%',
    right: '22%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    transform: [{ rotate: '5deg' }],
  },
  pulseDotWrap: {
    position: 'absolute',
    top: '38%',
    left: '48%',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4cdf8b',
    shadowColor: '#4cdf8b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  mapSecondaryPin: {
    position: 'absolute',
    top: '25%',
    left: '28%',
  },
  mapThirdPin: {
    top: '60%',
    left: '68%',
  },
  secondaryPinInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  /* ─── Search ─── */
  searchWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0, fontWeight: '500' },
  searchClear: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  /* ─── Tabs ─── */
  tabRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 2,
    zIndex: 1,
  },
  tabBg: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
    padding: 4,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tabSlider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    borderRadius: 11,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
    zIndex: 1,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabPill: { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  tabPillActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabPillText: { fontSize: 10, fontWeight: '700', color: Colors.textLight },
  tabPillTextActive: { color: '#fff' },

  /* ─── Filters ─── */
  filterContainer: { maxHeight: 44, marginTop: 4 },
  filterRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0.5,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipEmoji: { fontSize: 13 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textDark },
  filterChipTextActive: { color: '#fff' },

  /* ─── Results Header ─── */
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 4,
  },
  resultsCountWrap: {},
  resultsCount: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  resultsSub: { fontSize: 11, color: Colors.textLight, marginTop: -1 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sortText: { fontSize: 12, fontWeight: '600', color: Colors.textMedium },

  /* ─── Worker Card ─── */
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardAvatarWrap: { position: 'relative' },
  cardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 24 },
  cardAvailDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  distanceRingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  distanceRingText: { fontSize: 9, fontWeight: '700' },
  cardInfo: { gap: 1, flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  availChip: { backgroundColor: '#22c55e15', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  availChipText: { fontSize: 9, fontWeight: '700', color: '#22c55e' },
  cardTrade: { fontSize: 12, color: Colors.textMedium, fontWeight: '500', marginTop: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted },
  cardRating: { fontSize: 12, fontWeight: '700', color: Colors.textDark },
  cardExp: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', gap: 2, marginLeft: 10 },
  cardRate: { fontSize: 17, fontWeight: '800', color: Colors.secondary, letterSpacing: -0.3 },
  cardRateLabel: { fontSize: 10, color: Colors.textLight, marginTop: -2 },
  cardHireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 5,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHireText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* ─── Job Card ─── */
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  jobTop: { flexDirection: 'row', gap: 13 },
  jobIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobIcon: { fontSize: 22 },
  jobInfo: { flex: 1, gap: 2 },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, flex: 1 },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.error + '10',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  urgentText: { fontSize: 9, fontWeight: '700', color: Colors.error },
  jobClient: { fontSize: 12, color: Colors.textMedium, fontWeight: '500' },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
  jobDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  jobDistanceText: { fontSize: 10, fontWeight: '700' },
  jobLocation: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  jobBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: 2,
  },
  jobBudgetWrap: {},
  jobBudgetLabel: { fontSize: 10, color: Colors.textLight, fontWeight: '500' },
  jobBudget: { fontSize: 17, fontWeight: '800', color: Colors.secondary, letterSpacing: -0.3, marginTop: -1 },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobDuration: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  jobApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  jobApplyText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* ─── Empty ─── */
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  emptySub: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  emptyCta: { marginTop: 12, backgroundColor: Colors.primary, borderRadius: 99, paddingHorizontal: 24, paddingVertical: 10 },
  emptyCtaText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
