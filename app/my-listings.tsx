import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, Alert,
  TextInput, Modal, Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Colors } from '../constants/Colors';
import { errorMessage, formatPrice, type BackendProduct } from '../lib/backend';

type VendorProduct = BackendProduct & { costPrice: number | null; minStock: number };

type ListingStatus = 'active' | 'draft' | 'sold';

const TABS = [
  { key: 'listings', icon: 'storefront', label: 'Listings' },
  { key: 'inventory', icon: 'inventory-2', label: 'Inventory' },
] as const;

const STATUS_META: Record<ListingStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: Colors.primary, bg: Colors.greenTint },
  draft: { label: 'Draft', color: Colors.amber, bg: Colors.amberLight },
  sold: { label: 'Sold', color: Colors.secondary, bg: Colors.orangeTint },
};

// Same values as the backend CATEGORIES list (convex/products.ts).
const CATEGORIES = ['Cement', 'Steel & Iron', 'Roofing', 'Electrical', 'Plumbing', 'Tiles', 'Timber', 'Equipment', 'Glass', 'Paint', 'Blocks'];
const QUICK_RESTOCK = [10, 25, 50, 100];

const stockStatus = (stock: number, minStock: number) =>
  stock === 0
    ? { key: 'out', label: 'Out of stock', color: Colors.outline, bg: Colors.surfaceVariant }
    : stock <= minStock
      ? { key: 'low', label: 'Low stock', color: Colors.error, bg: '#ffdad6' }
      : { key: 'ok', label: 'In stock', color: Colors.primary, bg: Colors.greenTint };

const listedDate = (createdAt: number) =>
  new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/,/g, '');

const compact = (n: number) => (n >= 1e6 ? `₦${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `₦${Math.round(n / 1e3)}K` : formatPrice(n));

function FadeIn({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 200, delay: Math.min(index, 8) * 50, useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function StatCard({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: accent }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent === Colors.error ? Colors.error : Colors.onSurface }]} numberOfLines={1}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function Chips({ options, value, onSelect }: { options: { key: string; label: string; count?: number }[]; value: string; onSelect: (k: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <TouchableOpacity key={o.key} style={[styles.chip, active && styles.chipActive]} onPress={() => onSelect(o.key)} activeOpacity={0.7}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            {o.count !== undefined && <Text style={[styles.chipCount, active && styles.chipTextActive]}>{o.count}</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProductThumb({ uri }: { uri?: string }) {
  if (uri) return <Image source={{ uri }} style={{ width: 56, height: 56, borderRadius: 8 }} contentFit="cover" />;
  return <Text style={styles.emoji}>📦</Text>;
}

function ListingCard({ item, onAdvance, onDelete }: { item: VendorProduct; onAdvance: (p: VendorProduct) => void; onDelete: (p: VendorProduct) => void }) {
  const meta = STATUS_META[item.status];
  const nextAction = item.status === 'draft' ? { icon: 'publish', label: 'Publish' } : item.status === 'active' ? { icon: 'sell', label: 'Mark sold' } : null;
  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <View style={styles.cardRow}>
        <View style={styles.emojiTile}>
          <ProductThumb uri={item.photoUrls[0]} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
            <Pill {...meta} />
          </View>
          <Text style={styles.cardPrice}>
            {formatPrice(item.price)} <Text style={styles.cardPerUnit}>/ {item.unit}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialIcons name="inventory-2" size={14} color={Colors.outline} />
          <Text style={styles.metaText}>{item.stock} in stock</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="category" size={14} color={Colors.outline} />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>Listed {listedDate(item.createdAt)}</Text>
        <View style={styles.footerActions}>
          {nextAction && (
            <TouchableOpacity style={styles.textBtn} onPress={() => onAdvance(item)} activeOpacity={0.7}>
              <MaterialIcons name={nextAction.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.textBtnLabel}>{nextAction.label}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(item)} hitSlop={6} activeOpacity={0.6}>
            <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function InventoryCard({ item, onUpdateStock, onRestock }: {
  item: VendorProduct;
  onUpdateStock: (item: VendorProduct, delta: number) => void;
  onRestock: (item: VendorProduct) => void;
}) {
  const status = stockStatus(item.stock, item.minStock);
  const margin = item.costPrice && item.costPrice > 0 ? Math.round(((item.price - item.costPrice) / item.costPrice) * 100) : 0;
  const fill = Math.min(item.stock / (item.minStock * 2), 1);
  return (
    <View style={[styles.card, { borderLeftColor: status.color }, status.key === 'out' && styles.cardMuted]}>
      <View style={styles.cardRow}>
        <View style={styles.emojiTile}>
          <ProductThumb uri={item.photoUrls[0]} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
          </View>
          <View style={styles.subRow}>
            <Pill {...status} />
            <Text style={styles.subText}>{item.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Available</Text>
          <Text style={[styles.metricValue, { color: status.key === 'ok' ? Colors.onSurface : status.color }]}>
            {item.stock} <Text style={styles.metricUnit}>{item.unit}</Text>
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Price</Text>
          <Text style={styles.metricValue}>{formatPrice(item.price)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Margin</Text>
          <Text style={[styles.metricValue, { color: Colors.primary }]}>{margin}%</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${fill * 100}%`, backgroundColor: status.color }]} />
      </View>
      <Text style={styles.barCaption}>Min. level {item.minStock}</Text>

      <View style={styles.invActions}>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => onUpdateStock(item, -1)} disabled={item.stock === 0} activeOpacity={0.6}>
            <MaterialIcons name="remove" size={18} color={item.stock === 0 ? Colors.outlineVariant : Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{item.stock}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={() => onUpdateStock(item, 1)} activeOpacity={0.6}>
            <MaterialIcons name="add" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.restockBtn} onPress={() => onRestock(item)} activeOpacity={0.7}>
          <MaterialIcons name="add-box" size={16} color={Colors.onPrimary} />
          <Text style={styles.restockText}>Restock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MyListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mine = useQuery(api.products.mine);
  const removeProduct = useMutation(api.products.remove);
  const updateProduct = useMutation(api.products.update);
  const adjustStock = useMutation(api.products.adjustStock);

  const [activeTab, setActiveTab] = useState<'listings' | 'inventory'>('listings');
  const [query, setQuery] = useState('');
  const [listingFilter, setListingFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addCostPrice, setAddCostPrice] = useState('');
  const [addMinStock, setAddMinStock] = useState('');

  const [restockTarget, setRestockTarget] = useState<VendorProduct | null>(null);
  const [restockQty, setRestockQty] = useState('');

  const q = query.trim().toLowerCase();
  const products: VendorProduct[] = mine ?? [];

  const filteredListings = useMemo(
    () => products.filter((l) => (listingFilter === 'all' || l.status === listingFilter) && (!q || l.name.toLowerCase().includes(q))),
    [products, listingFilter, q]
  );

  const filteredInventory = useMemo(
    () => products.filter((i) => {
      const s = stockStatus(i.stock, i.minStock).key;
      const matchesFilter = stockFilter === 'all' || (stockFilter === 'low' ? s === 'low' : s === 'out');
      return matchesFilter && (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }),
    [products, stockFilter, q]
  );

  const listingStats = useMemo(() => ({
    active: products.filter((l) => l.status === 'active').length,
    draft: products.filter((l) => l.status === 'draft').length,
    sold: products.filter((l) => l.status === 'sold').length,
    value: products.filter((l) => l.status === 'active').reduce((s, l) => s + l.price * l.stock, 0),
  }), [products]);

  const inventoryStats = useMemo(() => ({
    units: products.reduce((s, i) => s + i.stock, 0),
    low: products.filter((i) => stockStatus(i.stock, i.minStock).key === 'low').length,
    out: products.filter((i) => i.stock === 0).length,
    profit: products.reduce((s, i) => s + ((i.price - (i.costPrice ?? i.price)) * i.stock), 0),
  }), [products]);

  const categoryProducts = useMemo(() => products.filter((p) => p.category === selectedCategory), [products, selectedCategory]);
  const selectedProduct = products.find((p) => p._id === selectedProductId) ?? null;

  const closeAddSheet = () => {
    setShowAddSheet(false);
    setSelectedCategory('');
    setSelectedProductId('');
    setAddQty('');
    setAddCostPrice('');
    setAddMinStock('');
  };

  const handleAddToInventory = async () => {
    if (!selectedProduct || !Number(addQty)) {
      Alert.alert('Missing details', 'Pick a product and enter a quantity.');
      return;
    }
    try {
      await adjustStock({
        id: selectedProduct._id as Id<'products'>,
        delta: Number(addQty),
        ...(addCostPrice ? { costPrice: Number(addCostPrice) } : {}),
      });
      closeAddSheet();
    } catch (e) {
      Alert.alert('Could not add stock', errorMessage(e));
    }
  };

  const closeRestock = () => {
    setRestockTarget(null);
    setRestockQty('');
  };

  const handleRestock = async () => {
    if (!restockTarget || !Number(restockQty)) return;
    try {
      await adjustStock({ id: restockTarget._id as Id<'products'>, delta: Number(restockQty) });
      closeRestock();
    } catch (e) {
      Alert.alert('Could not restock', errorMessage(e));
    }
  };

  const handleUpdateStock = async (item: VendorProduct, delta: number) => {
    try {
      await adjustStock({ id: item._id as Id<'products'>, delta });
    } catch (e) {
      Alert.alert('Could not update stock', errorMessage(e));
    }
  };

  const handleAdvanceListing = async (item: VendorProduct) => {
    try {
      await updateProduct({ id: item._id as Id<'products'>, status: item.status === 'draft' ? 'active' : 'sold' });
    } catch (e) {
      Alert.alert('Could not update listing', errorMessage(e));
    }
  };

  const handleDeleteListing = (item: VendorProduct) =>
    Alert.alert('Delete listing', `Delete "${item.name}"? Buyers will no longer see it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeProduct({ id: item._id as Id<'products'> });
          } catch (e) {
            Alert.alert('Could not delete', errorMessage(e));
          }
        },
      },
    ]);

  const isListings = activeTab === 'listings';
  const activeFilter = isListings ? listingFilter : stockFilter;

  const header = (
    <>
      <View style={styles.statsRow}>
        {isListings ? (
          <>
            <StatCard label="Active" value={String(listingStats.active)} accent={Colors.primary} sub={`${listingStats.draft} drafts`} />
            <StatCard label="Sold" value={String(listingStats.sold)} accent={Colors.secondary} />
            <StatCard label="Live value" value={compact(listingStats.value)} accent={Colors.tertiary} />
          </>
        ) : (
          <>
            <StatCard label="Units" value={inventoryStats.units.toLocaleString('en-NG')} accent={Colors.primary} />
            <StatCard label="Low stock" value={String(inventoryStats.low)} accent={inventoryStats.low ? Colors.error : Colors.outline} sub={inventoryStats.out ? `${inventoryStats.out} out` : undefined} />
            <StatCard label="Profit" value={compact(inventoryStats.profit)} accent={Colors.tertiary} />
          </>
        )}
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder={isListings ? 'Search listings' : 'Search products or categories'}
          placeholderTextColor={Colors.outline}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {isListings ? (
        <Chips
          value={listingFilter}
          onSelect={setListingFilter}
          options={[
            { key: 'all', label: 'All', count: products.length },
            { key: 'active', label: 'Active', count: listingStats.active },
            { key: 'draft', label: 'Drafts', count: listingStats.draft },
            { key: 'sold', label: 'Sold', count: listingStats.sold },
          ]}
        />
      ) : (
        <Chips
          value={stockFilter}
          onSelect={setStockFilter}
          options={[
            { key: 'all', label: 'All', count: products.length },
            { key: 'low', label: 'Low stock', count: inventoryStats.low },
            { key: 'out', label: 'Out of stock', count: inventoryStats.out },
          ]}
        />
      )}
    </>
  );

  const loadingView = (
    <View style={styles.empty}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.emptySub}>Loading your store…</Text>
    </View>
  );

  const empty = mine === undefined ? loadingView : (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={isListings ? 'storefront' : 'inventory-2'} size={36} color={Colors.outline} />
      </View>
      <Text style={styles.emptyTitle}>{q || activeFilter !== 'all' ? 'Nothing matches' : isListings ? 'No listings yet' : 'No stock yet'}</Text>
      <Text style={styles.emptySub}>
        {q || activeFilter !== 'all' ? 'Try a different search or filter.' : isListings ? 'Create your first listing to start selling.' : 'Add products to track your stock.'}
      </Text>
      {(q || activeFilter !== 'all') && (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => { setQuery(''); isListings ? setListingFilter('all') : setStockFilter('all'); }}
        >
          <Text style={styles.clearText}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const listProps = {
    contentContainerStyle: [styles.list, { paddingBottom: 104 + insets.bottom }],
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    ListHeaderComponent: header,
    ListEmptyComponent: empty,
  };

  const restockAfter = restockTarget ? restockTarget.stock + (Number(restockQty) || 0) : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'My Store', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background } }} />

      <View style={styles.segment}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => { setActiveTab(tab.key); setQuery(''); }}
              activeOpacity={0.7}
            >
              <MaterialIcons name={tab.icon as any} size={18} color={active ? Colors.onPrimary : Colors.onSurfaceVariant} />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab.label}</Text>
              {tab.key === 'inventory' && inventoryStats.low + inventoryStats.out > 0 && (
                <View style={styles.segmentBadge}>
                  <Text style={styles.segmentBadgeText}>{inventoryStats.low + inventoryStats.out}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isListings ? (
        <FlatList
          key="listings"
          data={mine === undefined ? [] : filteredListings}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <ListingCard item={item} onAdvance={handleAdvanceListing} onDelete={handleDeleteListing} />
            </FadeIn>
          )}
          {...listProps}
        />
      ) : (
        <FlatList
          key="inventory"
          data={mine === undefined ? [] : filteredInventory}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <InventoryCard
                item={item}
                onUpdateStock={handleUpdateStock}
                onRestock={(i) => { setRestockTarget(i); setRestockQty(''); }}
              />
            </FadeIn>
          )}
          {...listProps}
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.8}
          onPress={() => (isListings ? router.push('/add-listing') : setShowAddSheet(true))}
        >
          <MaterialIcons name="add" size={20} color={Colors.onSecondary} />
          <Text style={styles.ctaText}>{isListings ? 'New listing' : 'Add stock'}</Text>
        </TouchableOpacity>
      </View>

      <Sheet visible={showAddSheet} title="Add to stock" onClose={closeAddSheet}>
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Category</Text>
          <Chips
            value={selectedCategory}
            onSelect={(c) => { setSelectedCategory(c); setSelectedProductId(''); }}
            options={CATEGORIES.map((c) => ({ key: c, label: c }))}
          />

          {selectedCategory !== '' && (
            <>
              <Text style={[styles.label, styles.labelGap]}>Product</Text>
              {categoryProducts.map((p) => {
                const active = p._id === selectedProductId;
                return (
                  <TouchableOpacity key={p._id} style={[styles.productRow, active && styles.productRowActive]} onPress={() => setSelectedProductId(p._id)} activeOpacity={0.7}>
                    <ProductThumb uri={p.photoUrls[0]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.productPrice}>{formatPrice(p.price)} / {p.unit}</Text>
                    </View>
                    <MaterialIcons name={active ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={active ? Colors.primary : Colors.outlineVariant} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <View style={[styles.fieldRow, styles.labelGap]}>
            <View style={styles.field}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput style={styles.input} placeholder="50" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={addQty} onChangeText={(t) => setAddQty(t.replace(/\D/g, ''))} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Min. level</Text>
              <TextInput style={styles.input} placeholder="10" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={addMinStock} onChangeText={(t) => setAddMinStock(t.replace(/\D/g, ''))} />
            </View>
          </View>

          <Text style={[styles.label, styles.labelGap]}>Cost price per {selectedProduct?.unit ?? 'unit'}</Text>
          <View style={styles.currencyInput}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.currencyField}
              placeholder="6,200"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              value={Number(addCostPrice) ? Number(addCostPrice).toLocaleString('en-NG') : ''}
              onChangeText={(t) => setAddCostPrice(t.replace(/\D/g, ''))}
            />
          </View>
          {selectedProduct && Number(addCostPrice) > 0 && (
            <Text style={styles.hint}>
              Sells at {formatPrice(selectedProduct.price)} · {Math.round(((selectedProduct.price - Number(addCostPrice)) / Number(addCostPrice)) * 100)}% margin
            </Text>
          )}

          <TouchableOpacity style={[styles.cta, styles.sheetCta]} activeOpacity={0.8} onPress={handleAddToInventory}>
            <Text style={styles.ctaText}>Add to stock</Text>
          </TouchableOpacity>
        </ScrollView>
      </Sheet>

      <Sheet visible={!!restockTarget} title="Restock" onClose={closeRestock}>
        {restockTarget && (
          <>
            <View style={styles.restockItem}>
              <ProductThumb uri={restockTarget.photoUrls[0]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={1}>{restockTarget.name}</Text>
                <Text style={styles.productPrice}>Now {restockTarget.stock} {restockTarget.unit} · min. {restockTarget.minStock}</Text>
              </View>
            </View>

            <Text style={styles.label}>Add quantity</Text>
            <TextInput
              style={[styles.input, styles.bigInput]}
              placeholder="0"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              value={restockQty}
              onChangeText={(t) => setRestockQty(t.replace(/\D/g, ''))}
              autoFocus
            />
            <View style={styles.quickRow}>
              {QUICK_RESTOCK.map((n) => (
                <TouchableOpacity key={n} style={styles.chip} onPress={() => setRestockQty(String((Number(restockQty) || 0) + n))} activeOpacity={0.7}>
                  <Text style={styles.chipText}>+{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {Number(restockQty) > 0 && (
              <Text style={styles.hint}>New stock level: {restockAfter} {restockTarget.unit}</Text>
            )}

            <TouchableOpacity
              style={[styles.cta, styles.sheetCta, !Number(restockQty) && styles.ctaDisabled]}
              activeOpacity={0.8}
              onPress={handleRestock}
              disabled={!Number(restockQty)}
            >
              <Text style={styles.ctaText}>Confirm restock</Text>
            </TouchableOpacity>
          </>
        )}
      </Sheet>
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
  list: { paddingHorizontal: 16 },

  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 4,
    gap: 4,
    borderRadius: 999,
    backgroundColor: Colors.surfaceVariant + '99',
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 999,
  },
  segmentItemActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  segmentTextActive: { color: Colors.onPrimary },
  segmentBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...shadow,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  statSub: { fontSize: 12, color: Colors.outline, marginTop: 2 },

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
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },

  chipRow: { gap: 8, paddingBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    backgroundColor: Colors.surfaceVariant + '99',
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary },
  chipCount: { fontSize: 12, fontWeight: '700', color: Colors.outline },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  cardMuted: { backgroundColor: Colors.surface },
  cardRow: { flexDirection: 'row', gap: 12 },
  emojiTile: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant + '66',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.onSurface, lineHeight: 22 },
  cardPrice: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, marginTop: 4 },
  cardPerUnit: { fontSize: 13, fontWeight: '400', color: Colors.outline },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subText: { fontSize: 13, color: Colors.outline },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },

  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.onSurfaceVariant },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  cardDate: { fontSize: 12, color: Colors.outline },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: Colors.greenTint + '99' },
  textBtnLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  metrics: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metric: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  metricLabel: { fontSize: 11, fontWeight: '600', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 15, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  metricUnit: { fontSize: 12, fontWeight: '400', color: Colors.outline },

  barTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceVariant, marginTop: 12, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barCaption: { fontSize: 12, color: Colors.outline, marginTop: 6 },

  invActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
  stepBtn: { width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  restockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 16, borderRadius: 999, backgroundColor: Colors.primary },
  restockText: { fontSize: 14, fontWeight: '600', color: Colors.onPrimary },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },

  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceVariant + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline, textAlign: 'center', paddingHorizontal: 40 },
  clearBtn: { marginTop: 8, paddingHorizontal: 20, height: 40, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
  clearText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 8, maxHeight: '90%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface },
  sheetScroll: { flexGrow: 0 },
  sheetCta: { marginTop: 24 },

  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  labelGap: { marginTop: 8 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    fontSize: 16,
    color: Colors.onSurface,
  },
  bigInput: { height: 64, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  currencyInput: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, marginRight: 4 },
  currencyField: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.onSurface, paddingVertical: 0 },
  hint: { fontSize: 13, color: Colors.primary, fontWeight: '500', marginTop: 8 },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 8,
  },
  productRowActive: { borderColor: Colors.primary, backgroundColor: Colors.greenTint + '4d' },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  productPrice: { fontSize: 13, color: Colors.outline, marginTop: 2 },

  restockItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, backgroundColor: Colors.background, marginBottom: 16 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
