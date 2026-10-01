import { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { WORKERS, TRADES, type Worker } from '../../constants/MockData';
import WorkerCard from '../../components/WorkerCard';
import Dropdown from '../../components/Dropdown';
import { Pill, Sheet, PrimaryButton } from '../../components/EngineerUI';
import { useLocation } from '../../hooks/useLocation';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const TRADE_ICONS: Record<string, string> = {
  All: 'people', Mason: 'architecture', Electrician: 'bolt', Plumber: 'water', Carpenter: 'handyman',
  Painter: 'format-paint', Welder: 'whatshot', Tiler: 'grid-view', Designer: 'palette',
};

// "Mason" should match "Master Mason", "Designer" should match "Interior Designer".
const matchesTrade = (w: Worker, trade: string) => trade === 'All' || w.trade.toLowerCase().includes(trade.toLowerCase());

const TRADE_OPTIONS = TRADES.map((t) => ({
  value: t,
  label: t === 'All' ? 'All trades' : t,
  icon: TRADE_ICONS[t] ?? 'work',
  count: WORKERS.filter((w) => matchesTrade(w, t)).length,
}));

const SORTS = [
  { value: 'recommended', label: 'Recommended', icon: 'thumb-up' },
  { value: 'rating', label: 'Top rated', icon: 'star' },
  { value: 'rate', label: 'Lowest rate', icon: 'south' },
  { value: 'jobs', label: 'Most jobs done', icon: 'task-alt' },
  { value: 'experience', label: 'Most experienced', icon: 'workspace-premium' },
];

const SORTERS: Record<string, (a: Worker, b: Worker) => number> = {
  // Available first, then a blend of rating and track record.
  recommended: (a, b) => Number(b.available) - Number(a.available) || b.rating * Math.log(b.completedJobs + 1) - a.rating * Math.log(a.completedJobs + 1),
  rating: (a, b) => b.rating - a.rating,
  rate: (a, b) => a.dailyRate - b.dailyRate,
  jobs: (a, b) => b.completedJobs - a.completedJobs,
  experience: (a, b) => b.experience - a.experience,
};

function GridCard({ worker, requested, onPress }: { worker: Worker; requested: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, !worker.available && styles.avatarBusy]}>
          <Text style={styles.avatarEmoji}>{worker.avatar}</Text>
        </View>
        <View style={[styles.availDot, { backgroundColor: worker.available ? Colors.primary : Colors.outlineVariant }]} />
      </View>
      {worker.isPopular && (
        <View style={styles.popular}>
          <MaterialIcons name="local-fire-department" size={12} color={Colors.secondary} />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
      <Text style={styles.trade} numberOfLines={1}>{worker.trade}</Text>
      <View style={styles.metaRow}>
        <MaterialIcons name="star" size={14} color="#f5a623" />
        <Text style={styles.metaStrong}>{worker.rating}</Text>
        <Text style={styles.meta}>· {worker.completedJobs} jobs</Text>
      </View>
      <Text style={styles.rate}>
        {formatPrice(worker.dailyRate)}<Text style={styles.rateUnit}> /day</Text>
      </Text>
      <View style={[styles.hireBtn, !worker.available && styles.hireBtnBusy, requested && styles.hireBtnDone]}>
        {requested && <MaterialIcons name="check" size={16} color={Colors.primary} />}
        <Text style={[styles.hireText, !worker.available && styles.hireTextBusy, requested && styles.hireTextDone]}>
          {requested ? 'Requested' : worker.available ? 'Hire' : 'Busy'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function WorkersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState('All');
  const [sort, setSort] = useState('recommended');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openId, setOpenId] = useState<string | null>(null);
  const [days, setDays] = useState(1);
  const [requested, setRequested] = useState<string[]>([]);
  const { place, loading: locLoading, permission, refresh: locate } = useLocation({ auto: false });

  // Workers are stored as "Area, State", so match on the user's state or city.
  const userAreas = [place?.region, place?.city].filter(Boolean).map((s) => s!.toLowerCase());

  const q = search.trim().toLowerCase();
  const workers = useMemo(
    () => WORKERS
      .filter((w) =>
        matchesTrade(w, trade)
        && (!availableOnly || w.available)
        && (!nearMe || !userAreas.length || userAreas.some((a) => w.location.toLowerCase().includes(a)))
        && (!q || [w.name, w.trade, w.location, ...w.skills].join(' ').toLowerCase().includes(q)))
      .sort(SORTERS[sort]),
    [trade, availableOnly, nearMe, place, q, sort]
  );

  const toggleNearMe = () => {
    if (nearMe) return setNearMe(false);
    setNearMe(true);
    if (!place) locate();
  };

  const hasFilters = trade !== 'All' || availableOnly || nearMe || q.length > 0;
  const clearFilters = () => {
    setTrade('All');
    setAvailableOnly(false);
    setNearMe(false);
    setSearch('');
  };

  const worker = WORKERS.find((w) => w.id === openId);
  const openWorker = (id: string) => {
    setDays(1);
    setOpenId(id);
  };

  const sendRequest = () => {
    if (!worker) return;
    setRequested((prev) => [...prev, worker.id]);
    setOpenId(null);
    Alert.alert('Request sent', `${worker.name} will be asked to work ${days} day${days > 1 ? 's' : ''} for about ${formatPrice(worker.dailyRate * days)}. You'll be notified when they respond.`);
  };

  const nearMeLabel = nearMe && locLoading ? 'Locating…' : nearMe && place ? `Near ${place.city ?? place.region}` : 'Near me';

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, skill or area"
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
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            accessibilityLabel={viewMode === 'grid' ? 'Show as list' : 'Show as grid'}
          >
            <MaterialIcons name={viewMode === 'grid' ? 'view-agenda' : 'grid-view'} size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.iconBtnFilled]} onPress={() => router.push('/workers-marketplace' as any)} accessibilityLabel="Workers marketplace">
            <MaterialIcons name="storefront" size={22} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Dropdown title="Trade" value={trade} options={TRADE_OPTIONS} onChange={setTrade} />
          <Dropdown title="Sort by" value={sort} options={SORTS} onChange={setSort} />
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggle, availableOnly && styles.toggleActive]} onPress={() => setAvailableOnly(!availableOnly)} activeOpacity={0.7}>
            <MaterialIcons name={availableOnly ? 'check' : 'event-available'} size={16} color={availableOnly ? Colors.onPrimary : Colors.onSurfaceVariant} />
            <Text style={[styles.toggleText, availableOnly && styles.toggleTextActive]}>Available now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggle, nearMe && styles.toggleActive]} onPress={toggleNearMe} activeOpacity={0.7}>
            {nearMe && locLoading
              ? <ActivityIndicator size="small" color={Colors.onPrimary} />
              : <MaterialIcons name={nearMe ? 'check' : 'my-location'} size={16} color={nearMe ? Colors.onPrimary : Colors.onSurfaceVariant} />}
            <Text style={[styles.toggleText, nearMe && styles.toggleTextActive]} numberOfLines={1}>{nearMeLabel}</Text>
          </TouchableOpacity>
          <View style={styles.flex} />
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} hitSlop={8}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {nearMe && permission === 'denied' && (
          <Text style={styles.warn}>Location is off, so showing everyone. Enable it in Settings to filter by area.</Text>
        )}
        <Text style={styles.resultText}>{workers.length} professional{workers.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        key={viewMode}
        data={workers}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          viewMode === 'grid' ? (
            <View style={styles.cell}>
              <GridCard worker={item} requested={requested.includes(item.id)} onPress={() => openWorker(item.id)} />
            </View>
          ) : (
            <WorkerCard worker={item} onPress={() => openWorker(item.id)} />
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="person-search" size={32} color={Colors.outline} />
            </View>
            <Text style={styles.emptyTitle}>No professionals found</Text>
            <Text style={styles.emptySub}>Try another trade or clear your filters.</Text>
            {hasFilters && (
              <TouchableOpacity style={styles.emptyBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <Sheet visible={!!worker} title={worker?.name ?? ''} onClose={() => setOpenId(null)}>
        {worker && (
          <>
            <View style={styles.profileHead}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileEmoji}>{worker.avatar}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.profileTrade}>{worker.trade}</Text>
                <View style={styles.metaRow}>
                  <MaterialIcons name="location-on" size={14} color={Colors.outline} />
                  <Text style={styles.meta}>{worker.location}</Text>
                </View>
                <Pill
                  label={worker.available ? 'Available now' : 'Currently busy'}
                  color={worker.available ? Colors.primary : Colors.onSurfaceVariant}
                  bg={worker.available ? Colors.greenTint : Colors.surfaceVariant}
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                { value: `${worker.rating}★`, label: `${worker.reviewCount} reviews` },
                { value: String(worker.completedJobs), label: 'jobs done' },
                { value: `${worker.experience} yrs`, label: 'experience' },
              ].map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sheetLabel}>Skills</Text>
            <View style={styles.skills}>
              {worker.skills.map((s) => (
                <View key={s} style={styles.skill}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>

            {requested.includes(worker.id) ? (
              <View style={styles.requestedNote}>
                <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                <Text style={styles.requestedText}>Hire request sent. Waiting for a reply.</Text>
              </View>
            ) : worker.available ? (
              <>
                <Text style={styles.sheetLabel}>How many days?</Text>
                <View style={styles.daysRow}>
                  <TouchableOpacity style={styles.dayBtn} onPress={() => setDays(Math.max(1, days - 1))} disabled={days <= 1} accessibilityLabel="Fewer days">
                    <MaterialIcons name="remove" size={20} color={days <= 1 ? Colors.outlineVariant : Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.days}>{days} day{days > 1 ? 's' : ''}</Text>
                  <TouchableOpacity style={styles.dayBtn} onPress={() => setDays(Math.min(60, days + 1))} accessibilityLabel="More days">
                    <MaterialIcons name="add" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.flex} />
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Estimated</Text>
                    <Text style={styles.total}>{formatPrice(worker.dailyRate * days)}</Text>
                  </View>
                </View>
                <PrimaryButton label={`Request to hire ${worker.name.split(' ')[0]}`} icon="handshake" onPress={sendRequest} />
              </>
            ) : (
              <Text style={styles.busyNote}>{worker.name.split(' ')[0]} is booked right now. Check back later or pick someone available.</Text>
            )}
          </>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  top: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },
  iconBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  iconBtnFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  filterRow: { flexDirection: 'row', gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99', maxWidth: 180 },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant, flexShrink: 1 },
  toggleTextActive: { color: Colors.onPrimary },
  clearText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  warn: { fontSize: 13, color: Colors.tertiary },
  resultText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant, paddingBottom: 4 },

  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  gridRow: { gap: 12 },
  cell: { flex: 1, marginBottom: 12 },

  card: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.card,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarWrap: { marginBottom: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center' },
  avatarBusy: { backgroundColor: Colors.surfaceVariant },
  avatarEmoji: { fontSize: 32 },
  availDot: { position: 'absolute', right: 2, bottom: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: Colors.card },
  popular: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.orangeTint, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: Colors.onSurface, textAlign: 'center' },
  trade: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  metaStrong: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  meta: { fontSize: 13, color: Colors.outline },
  rate: { fontSize: 17, fontWeight: '700', color: Colors.onSurface, marginTop: 4 },
  rateUnit: { fontSize: 12, fontWeight: '400', color: Colors.outline },
  hireBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'stretch', height: 36, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 8 },
  hireBtnBusy: { backgroundColor: Colors.surfaceVariant },
  hireBtnDone: { backgroundColor: Colors.greenTint },
  hireText: { fontSize: 14, fontWeight: '600', color: Colors.onSecondary },
  hireTextBusy: { color: Colors.onSurfaceVariant },
  hireTextDone: { color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceVariant + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline },
  emptyBtn: { marginTop: 8, height: 40, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },

  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center' },
  profileEmoji: { fontSize: 36 },
  profileTrade: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  statsRow: { flexDirection: 'row', marginTop: 20, borderRadius: 8, backgroundColor: Colors.background, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  statLabel: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  sheetLabel: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginTop: 20, marginBottom: 8 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  skillText: { fontSize: 13, fontWeight: '500', color: Colors.onSurfaceVariant },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  days: { fontSize: 16, fontWeight: '700', color: Colors.onSurface, minWidth: 64, textAlign: 'center' },
  totalBox: { alignItems: 'flex-end' },
  totalLabel: { fontSize: 12, color: Colors.outline },
  total: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  requestedNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, padding: 12, borderRadius: 8, backgroundColor: Colors.greenTint + '80' },
  requestedText: { fontSize: 14, color: Colors.onSurface, flex: 1 },
  busyNote: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 20, lineHeight: 20 },
});
