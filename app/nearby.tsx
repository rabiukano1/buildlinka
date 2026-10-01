import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { WORKERS, TRADES } from '../constants/MockData';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import Dropdown, { type Option } from '../components/Dropdown';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const NEARBY_WORKERS = WORKERS.map((w, i) => ({ ...w, distance: +(0.3 + i * 0.7).toFixed(1) }));

const NEARBY_JOBS = [
  { id: 'nj1', title: 'Block Laying Needed', client: 'Mr. Adebayo O.', location: 'Ikeja, Lagos', distance: 0.8, budget: 120000, trade: 'Mason', duration: '2 weeks', urgent: true },
  { id: 'nj2', title: 'Full House Wiring', client: 'Mrs. Chioma E.', location: 'Surulere, Lagos', distance: 1.2, budget: 250000, trade: 'Electrician', duration: '1 week', urgent: false },
  { id: 'nj3', title: 'Bathroom Plumbing', client: 'Alh. Musa B.', location: 'Victoria Island', distance: 2.5, budget: 85000, trade: 'Plumber', duration: '3 days', urgent: true },
  { id: 'nj4', title: 'Roofing Installation', client: 'Eng. Ibrahim S.', location: 'Lekki, Lagos', distance: 3.1, budget: 350000, trade: 'Carpenter', duration: '1 month', urgent: false },
  { id: 'nj5', title: 'Tiling - 3 Bedroom Flat', client: 'Folake Ojo', location: 'Gbagada, Lagos', distance: 4.0, budget: 180000, trade: 'Tiler', duration: '1 week', urgent: false },
  { id: 'nj6', title: 'Interior Painting', client: 'Daniel Eze', location: 'Yaba, Lagos', distance: 1.8, budget: 95000, trade: 'Painter', duration: '4 days', urgent: true },
];

type NearbyWorker = typeof NEARBY_WORKERS[number];
type NearbyJob = typeof NEARBY_JOBS[number];
type Tab = 'workers' | 'jobs';

const TRADE_ICONS: Record<string, string> = {
  All: '📍', Mason: '🧱', Electrician: '⚡', Plumber: '🔧', Carpenter: '🪚',
  Painter: '🎨', Welder: '⚙️', Tiler: '🏛️', Designer: '📐',
};

const SORTS = {
  workers: [
    { value: 'nearest', label: 'Nearest first', icon: 'near-me' },
    { value: 'rating', label: 'Top rated', icon: 'star' },
    { value: 'price', label: 'Lowest rate', icon: 'south' },
  ],
  jobs: [
    { value: 'nearest', label: 'Nearest first', icon: 'near-me' },
    { value: 'budget', label: 'Highest budget', icon: 'payments' },
    { value: 'urgent', label: 'Urgent first', icon: 'bolt' },
  ],
} as const;

// "Mason" should match "Master Mason", "Designer" should match "Interior Designer".
const matchesTrade = (itemTrade: string, filter: string) => filter === 'All' || itemTrade.toLowerCase().includes(filter.toLowerCase());

const distanceColor = (km: number) => (km <= 1 ? Colors.primary : km <= 3 ? Colors.tertiary : Colors.secondary);

function WorkerCard({ worker }: { worker: NearbyWorker }) {
  const color = distanceColor(worker.distance);
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{worker.avatar}</Text>
          <View style={[styles.availDot, { backgroundColor: worker.available ? Colors.primary : Colors.outlineVariant }]} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle} numberOfLines={1}>{worker.name}</Text>
          <Text style={styles.cardSub}>{worker.trade}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="star" size={14} color="#f5a623" />
            <Text style={styles.metaStrong}>{worker.rating}</Text>
            <Text style={styles.metaText}>({worker.reviewCount})</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{worker.experience} yrs</Text>
          </View>
        </View>
        <View style={[styles.distancePill, { backgroundColor: color + '1a' }]}>
          <MaterialIcons name="near-me" size={12} color={color} />
          <Text style={[styles.distanceText, { color }]}>{worker.distance} km</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.flex}>
          <Text style={styles.priceLabel}>Daily rate</Text>
          <Text style={styles.price}>{formatPrice(worker.dailyRate)}</Text>
        </View>
        {!worker.available && <Text style={styles.busyText}>Busy now</Text>}
        <TouchableOpacity
          style={[styles.primaryBtn, !worker.available && styles.btnDisabled]}
          disabled={!worker.available}
          onPress={() => Alert.alert('Hire request sent', `${worker.name} will get your request and can accept it in the app.`)}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Hire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function JobCard({ job, applied, onApply }: { job: NearbyJob; applied: boolean; onApply: () => void }) {
  const color = distanceColor(job.distance);
  return (
    <View style={[styles.card, job.urgent && styles.cardUrgent]}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{TRADE_ICONS[job.trade] ?? '🛠️'}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle} numberOfLines={2}>{job.title}</Text>
          <Text style={styles.cardSub}>{job.client}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="location-on" size={14} color={Colors.outline} />
            <Text style={styles.metaText} numberOfLines={1}>{job.location}</Text>
            <View style={styles.metaDot} />
            <MaterialIcons name="schedule" size={14} color={Colors.outline} />
            <Text style={styles.metaText}>{job.duration}</Text>
          </View>
        </View>
        <View style={styles.pillCol}>
          <View style={[styles.distancePill, { backgroundColor: color + '1a' }]}>
            <MaterialIcons name="near-me" size={12} color={color} />
            <Text style={[styles.distanceText, { color }]}>{job.distance} km</Text>
          </View>
          {job.urgent && (
            <View style={styles.urgentPill}>
              <MaterialIcons name="bolt" size={12} color={Colors.error} />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.flex}>
          <Text style={styles.priceLabel}>Budget</Text>
          <Text style={styles.price}>{formatPrice(job.budget)}</Text>
        </View>
        <TouchableOpacity style={[styles.primaryBtn, applied && styles.appliedBtn]} onPress={onApply} activeOpacity={0.8}>
          {applied && <MaterialIcons name="check" size={16} color={Colors.primary} />}
          <Text style={[styles.primaryBtnText, applied && styles.appliedText]}>{applied ? 'Applied' : 'Apply'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function NearbyScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'jobs' ? 'jobs' : 'workers');
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState('All');
  const [sort, setSort] = useState('nearest');
  const [applied, setApplied] = useState<string[]>([]);

  const q = search.trim().toLowerCase();

  const workers = useMemo(() => {
    const list = NEARBY_WORKERS.filter((w) =>
      matchesTrade(w.trade, trade) && (!q || `${w.name} ${w.trade} ${w.location}`.toLowerCase().includes(q)));
    const by = sort === 'rating' ? (a: NearbyWorker, b: NearbyWorker) => b.rating - a.rating
      : sort === 'price' ? (a: NearbyWorker, b: NearbyWorker) => a.dailyRate - b.dailyRate
      : (a: NearbyWorker, b: NearbyWorker) => a.distance - b.distance;
    return list.sort(by);
  }, [trade, q, sort]);

  const jobs = useMemo(() => {
    const list = NEARBY_JOBS.filter((j) =>
      matchesTrade(j.trade, trade) && (!q || `${j.title} ${j.trade} ${j.location}`.toLowerCase().includes(q)));
    const by = sort === 'budget' ? (a: NearbyJob, b: NearbyJob) => b.budget - a.budget
      : sort === 'urgent' ? (a: NearbyJob, b: NearbyJob) => Number(b.urgent) - Number(a.urgent) || a.distance - b.distance
      : (a: NearbyJob, b: NearbyJob) => a.distance - b.distance;
    return list.sort(by);
  }, [trade, q, sort]);

  const tradeOptions: Option[] = TRADES.map((t) => ({
    value: t,
    label: t === 'All' ? 'All trades' : t,
    emoji: TRADE_ICONS[t],
    count: (tab === 'workers' ? NEARBY_WORKERS : NEARBY_JOBS).filter((x) => matchesTrade(x.trade, t)).length,
  }));

  const switchTab = (t: Tab) => {
    setTab(t);
    setSort('nearest');
  };

  const clearFilters = () => {
    setSearch('');
    setTrade('All');
  };

  const count = tab === 'workers' ? workers.length : jobs.length;
  const noun = tab === 'workers' ? 'worker' : 'job';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Find Nearby', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <View style={styles.top}>
        <View style={styles.segment}>
          {(['workers', 'jobs'] as const).map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={() => switchTab(t)} activeOpacity={0.7}>
                <MaterialIcons name={t === 'workers' ? 'people' : 'work'} size={18} color={active ? Colors.onPrimary : Colors.onSurfaceVariant} />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t === 'workers' ? 'Workers' : 'Jobs'}</Text>
                <Text style={[styles.segmentCount, active && styles.segmentTextActive]}>{t === 'workers' ? NEARBY_WORKERS.length : NEARBY_JOBS.length}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'workers' ? 'Search name, trade or area' : 'Search job, trade or area'}
            placeholderTextColor={Colors.outline}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <Dropdown title="Trade" value={trade} options={tradeOptions} onChange={setTrade} />
          <Dropdown title="Sort by" value={sort} options={SORTS[tab] as unknown as Option[]} onChange={setSort} />
        </View>
      </View>

      <KeyboardAwareWrapper contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}>
        <Text style={styles.resultCount}>
          {count} {noun}{count !== 1 ? 's' : ''} near you{trade !== 'All' ? ` · ${trade}` : ''}
        </Text>

        {tab === 'workers'
          ? workers.map((w) => <WorkerCard key={w.id} worker={w} />)
          : jobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              applied={applied.includes(j.id)}
              onApply={() => setApplied((prev) => (prev.includes(j.id) ? prev.filter((x) => x !== j.id) : [...prev, j.id]))}
            />
          ))}

        {count === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name={tab === 'workers' ? 'people-outline' : 'work-outline'} size={32} color={Colors.outline} />
            </View>
            <Text style={styles.emptyTitle}>No {noun}s found</Text>
            <Text style={styles.emptySub}>Try another trade or clear your search.</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareWrapper>
    </View>
  );
}

const shadow = {
  shadowColor: '#1b1c1c',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  list: { padding: 16, paddingTop: 12 },

  segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 999 },
  segmentItemActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  segmentTextActive: { color: Colors.onPrimary },
  segmentCount: { fontSize: 12, fontWeight: '700', color: Colors.outline },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },

  filterRow: { flexDirection: 'row', gap: 8 },

  resultCount: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant, marginBottom: 12 },

  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 12, ...shadow },
  cardUrgent: { borderLeftWidth: 4, borderLeftColor: Colors.error },
  cardRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.surfaceVariant + '66', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26 },
  availDot: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.card },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface, lineHeight: 22 },
  cardSub: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaStrong: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  metaText: { fontSize: 13, color: Colors.outline, flexShrink: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.outlineVariant, marginHorizontal: 4 },
  pillCol: { alignItems: 'flex-end', gap: 6 },
  distancePill: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  distanceText: { fontSize: 12, fontWeight: '700' },
  urgentPill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#ffdad6' },
  urgentText: { fontSize: 12, fontWeight: '700', color: Colors.error },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider },
  priceLabel: { fontSize: 12, color: Colors.outline },
  price: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, marginTop: 1 },
  busyText: { fontSize: 13, color: Colors.outline },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40, paddingHorizontal: 22, borderRadius: 999, backgroundColor: Colors.secondary },
  primaryBtnText: { fontSize: 14, fontWeight: '600', color: Colors.onSecondary },
  btnDisabled: { backgroundColor: Colors.outlineVariant },
  appliedBtn: { backgroundColor: Colors.greenTint },
  appliedText: { color: Colors.primary },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceVariant + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline },
  clearBtn: { marginTop: 8, height: 40, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
  clearText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
