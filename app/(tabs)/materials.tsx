import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../../constants/Colors';
import { formatPrice, type BackendProduct } from '../../lib/backend';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import ProductCard from '../../components/ProductCard';
import { Image } from 'expo-image';
import Dropdown from '../../components/Dropdown';

const CATEGORIES = ['Cement', 'Steel & Iron', 'Roofing', 'Electrical', 'Plumbing', 'Tiles', 'Timber', 'Equipment', 'Glass', 'Paint', 'Blocks'];

const SORTS = [
  { value: 'newest', label: 'Newest first', icon: 'schedule' },
  { value: 'price-asc', label: 'Price: low to high', icon: 'south' },
  { value: 'price-desc', label: 'Price: high to low', icon: 'north' },
];

const SORTERS: Record<string, (a: BackendProduct, b: BackendProduct) => number> = {
  newest: (a, b) => b.createdAt - a.createdAt,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

const CATEGORY_OPTIONS = [
  { value: 'All', label: 'All categories', icon: 'apps' },
  ...CATEGORIES.map((name) => ({ value: name, label: name, icon: 'category' })),
];

function GridCard({ product, quantity, onPress, onAdd, onChangeQty, onToggleSave, saved }: {
  product: BackendProduct;
  quantity: number;
  onPress: () => void;
  onAdd: () => void;
  onChangeQty: (q: number) => void;
  onToggleSave: () => void;
  saved: boolean;
}) {
  const out = product.stock <= 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageBox}>
        {product.photoUrls[0]
          ? <Image source={{ uri: product.photoUrls[0] }} style={{ width: 72, height: 72, borderRadius: 8 }} contentFit="cover" />
          : <Text style={styles.emoji}>📦</Text>}
        <TouchableOpacity style={styles.saveBtn} onPress={onToggleSave} hitSlop={8} accessibilityLabel={saved ? 'Remove from saved' : 'Save'}>
          <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={18} color={saved ? Colors.secondary : Colors.onSurfaceVariant} />
        </TouchableOpacity>
        {out && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Out of stock</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.vendorRow}>
          <Text style={styles.vendor} numberOfLines={1}>{product.storeName}</Text>
          {product.storeVerified && <MaterialIcons name="verified" size={12} color={Colors.primary} />}
        </View>
        <Text style={styles.price}>
          {formatPrice(product.price)}<Text style={styles.unit}> /{product.unit}</Text>
        </Text>

        {quantity > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onChangeQty(quantity - 1)} hitSlop={4} accessibilityLabel="Decrease quantity">
              <MaterialIcons name={quantity === 1 ? 'delete-outline' : 'remove'} size={18} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepQty}>{quantity}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onChangeQty(quantity + 1)} hitSlop={4} accessibilityLabel="Increase quantity">
              <MaterialIcons name="add" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, out && styles.addBtnDisabled]}
            onPress={onAdd}
            disabled={out}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-shopping-cart" size={16} color={Colors.onSecondary} />
            <Text style={styles.addText}>{out ? 'Out of stock' : 'Add'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MaterialsScreen() {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { isSaved, toggleSave } = useSaved();
  const params = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  // The tab stays mounted, so pick up new ?q= from Search's "See all".
  useEffect(() => {
    if (params.q) setSearch(params.q);
  }, [params.q]);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const q = search.trim();
  // Server filters by category + search; stock toggle + sort stay client-side.
  const rows = useQuery(
    api.products.list,
    { category: category === 'All' ? undefined : category, search: q || undefined }
  );
  const products = useMemo(
    () => (rows ?? [])
      .filter((p) => !inStockOnly || p.stock > 0)
      .sort(SORTERS[sort]),
    [rows, inStockOnly, sort]
  );

  const qtyOf = (id: string) => items.find((i) => i.product._id === id)?.quantity ?? 0;
  const changeQty = (p: BackendProduct, qty: number) => (qty <= 0 ? removeItem(p._id) : updateQuantity(p._id, qty));
  const hasFilters = category !== 'All' || inStockOnly || q.length > 0;
  const clearFilters = () => {
    setCategory('All');
    setInStockOnly(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cement, rods, tiles…"
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
            style={styles.viewBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            accessibilityLabel={viewMode === 'grid' ? 'Show as list' : 'Show as grid'}
          >
            <MaterialIcons name={viewMode === 'grid' ? 'view-agenda' : 'grid-view'} size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Dropdown title="Category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
          <Dropdown title="Sort by" value={sort} options={SORTS} onChange={setSort} />
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={[styles.toggleChip, inStockOnly && styles.toggleChipActive]} onPress={() => setInStockOnly(!inStockOnly)} activeOpacity={0.7}>
            <MaterialIcons name={inStockOnly ? 'check' : 'inventory-2'} size={14} color={inStockOnly ? Colors.onPrimary : Colors.onSurfaceVariant} />
            <Text style={[styles.toggleChipText, inStockOnly && styles.toggleChipTextActive]}>In stock</Text>
          </TouchableOpacity>
          {hasFilters && (
            <TouchableOpacity onPress={clearFilters} hitSlop={8}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          viewMode === 'grid' ? (
            <View style={styles.cell}>
              <GridCard
                product={item}
                quantity={qtyOf(item._id)}
                onPress={() => router.push(`/product/${item._id}`)}
                onAdd={() => addItem(item)}
                onChangeQty={(qty) => changeQty(item, qty)}
                onToggleSave={() => toggleSave(item)}
                saved={isSaved(item._id)}
              />
            </View>
          ) : (
            <ProductCard
              product={item}
              horizontal
              onPress={() => router.push(`/product/${item._id}`)}
              onAddToCart={() => addItem(item)}
              onToggleSave={() => toggleSave(item)}
              isSaved={isSaved(item._id)}
            />
          )
        }
        ListEmptyComponent={
          rows === undefined ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptySub}>Loading materials…</Text>
            </View>
          ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="search-off" size={32} color={Colors.outline} />
            </View>
            <Text style={styles.emptyTitle}>No materials found</Text>
            <Text style={styles.emptySub}>
              {hasFilters ? 'Try another category or search term.' : 'No products listed yet. Vendors can add the first listing.'}
            </Text>
            {hasFilters && (
              <TouchableOpacity style={styles.emptyBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  top: { paddingHorizontal: 16, paddingTop: 12, gap: 12, backgroundColor: Colors.background },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBar: {
    flex: 1,
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
  viewBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },

  filterRow: { flexDirection: 'row', gap: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 4 },
  resultText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  toggleChipActive: { backgroundColor: Colors.primary },
  toggleChipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  toggleChipTextActive: { color: Colors.onPrimary },
  clearText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  gridRow: { gap: 12 },
  cell: { flex: 1, marginBottom: 12 },

  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  imageBox: { height: 128, backgroundColor: Colors.surfaceVariant + '80', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48 },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOrange: { backgroundColor: Colors.secondary },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  saveBtn: { position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  soldOut: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 4, backgroundColor: 'rgba(27,28,28,0.7)', alignItems: 'center' },
  soldOutText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  info: { padding: 12, gap: 4 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, lineHeight: 19, minHeight: 38 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  vendor: { fontSize: 12, color: Colors.outline, flexShrink: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 12, fontWeight: '700', color: Colors.onSurface },
  reviews: { fontSize: 12, color: Colors.outline },
  price: { fontSize: 17, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  unit: { fontSize: 12, fontWeight: '400', color: Colors.outline },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 6 },
  addBtnDisabled: { backgroundColor: Colors.outlineVariant },
  addText: { fontSize: 14, fontWeight: '600', color: Colors.onSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36, borderRadius: 999, borderWidth: 1, borderColor: Colors.primary, marginTop: 6, paddingHorizontal: 4 },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepQty: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 64, gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceVariant + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline },
  emptyBtn: { marginTop: 8, height: 40, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
});
