import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { WORKERS, TRADES, type Worker } from '../../constants/MockData';
import SearchBar from '../../components/SearchBar';
import WorkerCard from '../../components/WorkerCard';
import { useLocation } from '../../hooks/useLocation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');
const formatCount = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));

const TRADE_ICONS: Record<string, string> = {
  All: 'people',
  Mason: 'architecture',
  Electrician: 'bolt',
  Plumber: 'water',
  Carpenter: 'handyman',
  Painter: 'format-paint',
  Welder: 'whatshot',
  Tiler: 'grid-view',
  Designer: 'palette',
};

function WorkerGridCard({ worker }: { worker: Worker }) {
  return (
    <TouchableOpacity style={styles.wGridCard} activeOpacity={0.85}>
      <View style={[styles.wGridAvatar, !worker.available && styles.wGridAvatarBusy]}>
        <Text style={styles.wGridEmoji}>{worker.avatar}</Text>
      </View>
      <Text style={styles.wGridName} numberOfLines={1}>{worker.name}</Text>
      <Text style={styles.wGridTrade} numberOfLines={1}>{worker.trade}</Text>
      <View style={styles.wGridMeta}>
        <View style={styles.wGridRating}>
          <MaterialIcons name="star" size={11} color={Colors.amber} />
          <Text style={styles.wGridRatingText}>{worker.rating}</Text>
        </View>
        <Text style={styles.wGridDot}>·</Text>
        <Text style={styles.wGridJobs}>{formatCount(worker.completedJobs)} jobs</Text>
      </View>
      <View style={styles.wGridRateRow}>
        <Text style={styles.wGridRate}>{formatPrice(worker.dailyRate)}</Text>
        <Text style={styles.wGridRateLabel}>/day</Text>
      </View>
      <TouchableOpacity
        style={[styles.wGridHire, !worker.available && styles.wGridHireDisabled]}
        disabled={!worker.available}
      >
        <Text style={[styles.wGridHireText, !worker.available && styles.wGridHireTextDisabled]}>
          {worker.available ? 'Hire Now' : 'Unavailable'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function WorkersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { address: userAddress, loading: locLoading } = useLocation();

  const filterAnim = useRef(new Animated.Value(0)).current;
  const filterOpen = useRef(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredWorkers = useMemo(() => {
    let list = WORKERS;

    if (selectedTrade !== 'All') {
      list = list.filter((w) =>
        w.trade.toLowerCase().includes(selectedTrade.toLowerCase())
      );
    }

    if (availableOnly) {
      list = list.filter((w) => w.available);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.trade.toLowerCase().includes(q) ||
          w.skills.some((s) => s.toLowerCase().includes(q)) ||
          w.location.toLowerCase().includes(q)
      );
    }

    if (sortByRating) {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    if (nearMe && userAddress) {
      const region = userAddress.split(',').pop()?.trim().toLowerCase() || '';
      if (region) {
        list = list.filter((w) => w.location.toLowerCase().includes(region));
      }
    }

    return list;
  }, [searchQuery, selectedTrade, availableOnly, sortByRating, nearMe, userAddress]);

  const activeFilterCount =
    (selectedTrade !== 'All' ? 1 : 0) + (availableOnly ? 1 : 0) + (sortByRating ? 1 : 0) + (nearMe ? 1 : 0);

  const renderWorker = ({ item }: { item: Worker }) => (
    viewMode === 'grid' ? (
      <View style={styles.gridCell}>
        <WorkerGridCard worker={item} />
      </View>
    ) : (
      <WorkerCard worker={item} />
    )
  );

  const renderHeader = () => (
    <View>
      {/* ─── Search + actions ─── */}
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <SearchBar
            placeholder="Search workers by name, skill, or location..."
            onSearch={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <MaterialIcons
              name={viewMode === 'grid' ? 'view-list' : 'grid-view'}
              size={20}
              color={Colors.primaryGreen}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/workers-marketplace' as any)}
          >
            <MaterialIcons name="storefront" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Trade chips ─── */}
      <View style={styles.chipStrip}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TRADES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipStripInner}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tradeChip, selectedTrade === item && styles.tradeChipActive]}
              onPress={() => setSelectedTrade(item)}
            >
              <MaterialIcons
                name={(TRADE_ICONS[item] || 'work') as any}
                size={15}
                color={selectedTrade === item ? '#fff' : Colors.textMedium}
              />
              <Text
                style={[
                  styles.tradeChipText,
                  selectedTrade === item && styles.tradeChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ─── Quick filter toggles ─── */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.qfBtn, availableOnly && styles.qfBtnActive]}
          onPress={() => setAvailableOnly(!availableOnly)}
        >
          <MaterialIcons
            name="check-circle"
            size={16}
            color={availableOnly ? '#fff' : Colors.lightGreen}
          />
          <Text style={[styles.qfBtnText, availableOnly && styles.qfBtnTextActive]}>
            Available Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.qfBtn, sortByRating && styles.qfBtnActiveOrange]}
          onPress={() => setSortByRating(!sortByRating)}
        >
          <MaterialIcons
            name="star"
            size={16}
            color={sortByRating ? '#fff' : Colors.amber}
          />
          <Text style={[styles.qfBtnText, sortByRating && styles.qfBtnTextActive]}>
            Top Rated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.qfBtn, nearMe && styles.qfBtnActive]}
          onPress={() => setNearMe(!nearMe)}
        >
          <MaterialIcons
            name="my-location"
            size={16}
            color={nearMe ? '#fff' : Colors.primaryGreen}
          />
          <Text style={[styles.qfBtnText, nearMe && styles.qfBtnTextActive]}>
            {locLoading ? '...' : 'Near Me'}
          </Text>
        </TouchableOpacity>
        <View style={styles.qfSpacer} />
        <TouchableOpacity style={styles.qfCount}>
          <Text style={styles.qfCountText}>{filteredWorkers.length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredWorkers}
        renderItem={renderWorker}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={[
          styles.listContent,
          viewMode === 'grid' && styles.listContentGrid,
        ]}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGreen} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="person-search" size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>No workers found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters
            </Text>
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

  /* ─── Top bar ─── */
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ─── Trade chips ─── */
  chipStrip: {
    marginTop: 10,
  },
  chipStripInner: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  tradeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tradeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  tradeChipTextActive: {
    color: '#fff',
  },

  /* ─── Quick filters ─── */
  quickFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  qfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  qfBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  qfBtnActiveOrange: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  qfBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  qfBtnTextActive: {
    color: '#fff',
  },
  qfSpacer: {
    flex: 1,
  },
  qfCount: {
    backgroundColor: Colors.primaryGreen,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qfCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ─── FlatList ─── */
  listHeader: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  listContentGrid: {
    paddingHorizontal: GRID_PADDING,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridCell: {
    flex: 1,
  },

  /* ─── Worker Grid Card ─── */
  wGridCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wGridAvatar: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  wGridAvatarBusy: {
    borderColor: Colors.border,
    backgroundColor: Colors.divider,
  },
  wGridEmoji: { fontSize: 26 },
  wGridName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 4,
  },
  wGridTrade: {
    fontSize: 11,
    color: Colors.primaryGreen,
    fontWeight: '600',
  },
  wGridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  wGridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  wGridRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  wGridDot: {
    color: Colors.border,
    fontSize: 12,
  },
  wGridJobs: {
    fontSize: 10.5,
    color: Colors.textMuted,
  },
  wGridRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  wGridRate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  wGridRateLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  wGridHire: {
    marginTop: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  wGridHireDisabled: {
    backgroundColor: Colors.border,
  },
  wGridHireText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  wGridHireTextDisabled: {
    color: Colors.textMuted,
  },

  /* ─── Empty ─── */
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
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textLight,
  },
});
