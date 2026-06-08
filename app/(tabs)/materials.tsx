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
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { CATEGORIES, PRODUCTS, type Product } from '../../constants/MockData';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;

const SORT_OPTIONS = ['Popular', 'Price: Low', 'Price: High', 'Rating'] as const;

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');
const formatCount = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));

function GridCard({ product, onPress, onAddToCart, onToggleSave, isSaved }: { product: Product; onPress?: () => void; onAddToCart?: () => void; onToggleSave?: () => void; isSaved?: boolean }) {
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.gridImageBox}>
        <Text style={styles.gridEmoji}>{product.imageEmoji}</Text>
        {product.badge && (
          <View style={[styles.gridBadge, product.badge === 'Best Seller' && styles.gridBadgeOrange]}>
            <Text style={styles.gridBadgeText}>{product.badge}</Text>
          </View>
        )}
        {!product.inStock && (
          <View style={styles.gridOutOfStock}>
            <Text style={styles.gridOutOfStockText}>Out of Stock</Text>
          </View>
        )}
        {onToggleSave && (
          <TouchableOpacity style={styles.gridSaveBtn} onPress={onToggleSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? Colors.primaryOrange : Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.gridVendor} numberOfLines={1}>{product.vendor}</Text>
        <View style={styles.gridPriceRow}>
          <Text style={styles.gridPrice}>{formatPrice(product.price)}</Text>
          <Text style={styles.gridUnit}>/{product.unit}</Text>
        </View>
        <View style={styles.gridBottom}>
          <View style={styles.gridRating}>
            <MaterialIcons name="star" size={11} color={Colors.amber} />
            <Text style={styles.gridRatingText}>{product.rating}</Text>
          </View>
          <TouchableOpacity style={styles.gridCartBtn} onPress={onAddToCart}>
            <MaterialIcons name="shopping-cart" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MaterialsScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState<string>('Popular');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filterAnim = useRef(new Animated.Value(0)).current;
  const filterOpen = useRef(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const toggleFilters = () => {
    const toValue = filterOpen.current ? 0 : 1;
    filterOpen.current = !filterOpen.current;
    Animated.spring(filterAnim, {
      toValue,
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start();
  };

  const filteredProducts = useMemo(() => {
    let list = PRODUCTS;
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.vendor.toLowerCase().includes(q)
      );
    }
    switch (selectedSort) {
      case 'Price: Low':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'Price: High':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'Rating':
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      default:
        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return list;
  }, [searchQuery, selectedCategory, selectedSort]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) + (selectedSort !== 'Popular' ? 1 : 0);

  const filterPanelHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const filterPanelOpacity = filterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    if (viewMode === 'grid') {
      return (
        <View style={styles.gridCell}>
          <GridCard
            product={item}
            onPress={() => router.push(`/product/${item.id}`)}
            onAddToCart={() => addItem(item)}
            onToggleSave={() => toggleSave(item)}
            isSaved={isSaved(item.id)}
          />
        </View>
      );
    }
    return (
      <ProductCard
        product={item}
        horizontal
        onPress={() => router.push(`/product/${item.id}`)}
        onAddToCart={() => addItem(item)}
        onToggleSave={() => toggleSave(item)}
        isSaved={isSaved(item.id)}
      />
    );
  };

  const renderHeader = () => (
    <View>
      {/* ─── Search + actions ─── */}
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <SearchBar placeholder="Search materials..." onSearch={setSearchQuery} />
          <TouchableOpacity
            style={[styles.iconBtn, filterOpen.current && styles.iconBtnActive]}
            onPress={toggleFilters}
          >
            <MaterialIcons
              name="tune"
              size={20}
              color={filterOpen.current ? '#fff' : Colors.primaryGreen}
            />
            {activeFilterCount > 0 && !filterOpen.current && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
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
        </View>
      </View>

      {/* ─── Category chips ─── */}
      <View style={styles.chipStrip}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...CATEGORIES.map((c) => c.name)]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipStripInner}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.stripChip, selectedCategory === item && styles.stripChipActive]}
              onPress={() => {
                if (item === 'Cement') { router.push('/category/cement'); }
                else if (item === 'Steel & Iron') { router.push('/category/steel-iron'); }
                else if (item === 'Roofing') { router.push('/category/roofing'); }
                else if (item === 'Electrical') { router.push('/category/electrical'); }
                else if (item === 'Plumbing') { router.push('/category/plumbing'); }
                else if (item === 'Tiles') { router.push('/category/tiles'); }
                else if (item === 'Timber') { router.push('/category/timber'); }
                else if (item === 'Equipment') { router.push('/category/equipment'); }
                else if (item === 'Glass') { router.push('/category/glass'); }
                else if (item === 'Paint') { router.push('/category/paint'); }
                else if (item === 'Blocks') { router.push('/category/blocks'); }
                else { setSelectedCategory(item); }
              }}
            >
              <Text
                style={[
                  styles.stripChipText,
                  selectedCategory === item && styles.stripChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ─── Animated filter panel ─── */}
      <Animated.View
        style={[
          styles.filterPanel,
          {
            maxHeight: filterPanelHeight,
            opacity: filterPanelOpacity,
          },
        ]}
      >
        <View style={styles.filterPanelInner}>
          <Text style={styles.filterPanelLabel}>Sort By</Text>
          <View style={styles.filterSortRow}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.sortChip, selectedSort === opt && styles.sortChipActive]}
                onPress={() => setSelectedSort(opt)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    selectedSort === opt && styles.sortChipTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ─── Stats bar ─── */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {formatCount(filteredProducts.length)} product{filteredProducts.length !== 1 && 's'}
        </Text>
        {selectedCategory !== 'All' && (
          <View style={styles.activeCatChip}>
            <Text style={styles.activeCatChipText}>{selectedCategory}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory('All')}>
              <MaterialIcons name="close" size={14} color={Colors.primaryGreen} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
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
            <MaterialIcons name="search-off" size={52} color={Colors.border} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
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
    position: 'relative',
  },
  iconBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  /* ─── Category strip ─── */
  chipStrip: {
    marginTop: 8,
  },
  chipStripInner: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stripChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  stripChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stripChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  stripChipTextActive: {
    color: '#fff',
  },

  /* ─── Filter panel ─── */
  filterPanel: {
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPanelInner: {
    padding: 16,
    gap: 10,
  },
  filterPanelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterSortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  sortChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  sortChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  sortChipTextActive: {
    color: '#fff',
  },

  /* ─── Stats bar ─── */
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 12.5,
    color: Colors.textLight,
    fontWeight: '600',
  },
  activeCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeCatChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },

  /* ─── FlatList ─── */
  listHeader: {
    flexGrow: 0,
  },
  listContent: {
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

  /* ─── Grid Card ─── */
  gridCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  gridImageBox: {
    height: 120,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridEmoji: { fontSize: 44 },
  gridBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primaryGreen,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridBadgeOrange: { backgroundColor: Colors.primaryOrange },
  gridBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  gridSaveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 99,
    padding: 4,
  },
  gridOutOfStock: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#00000050',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOutOfStockText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  gridInfo: {
    padding: 10,
    gap: 3,
  },
  gridName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textDark,
    lineHeight: 16,
    minHeight: 32,
  },
  gridVendor: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  gridPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  gridUnit: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  gridBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  gridCartBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    padding: 6,
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
