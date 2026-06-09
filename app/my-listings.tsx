import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, Alert,
  TextInput, Modal, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { PRODUCTS } from '../constants/MockData';

type ListingStatus = 'active' | 'draft' | 'sold';

type Listing = {
  id: string;
  title: string;
  emoji: string;
  price: number;
  quantity: number;
  unit: string;
  views: number;
  inquiries: number;
  date: string;
  status: ListingStatus;
};

const MY_LISTINGS: Listing[] = [
  { id: 'LST-001', title: 'Dangote Cement 42.5R (50kg)', emoji: '🏗️', price: 8500, quantity: 50, unit: 'bag', views: 234, inquiries: 12, date: '2 Jun 2026', status: 'active' },
  { id: 'LST-002', title: 'Iron Rod 12mm (6m)', emoji: '⚙️', price: 6800, quantity: 30, unit: 'piece', views: 189, inquiries: 8, date: '28 May 2026', status: 'active' },
  { id: 'LST-003', title: 'Ceramic Floor Tiles 60×60cm', emoji: '🏛️', price: 3500, quantity: 100, unit: 'box', views: 145, inquiries: 5, date: '15 May 2026', status: 'active' },
  { id: 'LST-004', title: 'Aluminum Roofing Sheet 0.5mm', emoji: '🏠', price: 4200, quantity: 20, unit: 'sheet', views: 78, inquiries: 3, date: '10 May 2026', status: 'draft' },
  { id: 'LST-005', title: 'PVC Water Pipe 3/4 inch (9m)', emoji: '🔧', price: 2800, quantity: 40, unit: 'piece', views: 312, inquiries: 15, date: '5 May 2026', status: 'sold' },
  { id: 'LST-006', title: 'Sandcrete Block (9 inches)', emoji: '🧱', price: 400, quantity: 200, unit: 'block', views: 567, inquiries: 22, date: '28 Apr 2026', status: 'active' },
  { id: 'LST-007', title: 'Emulsion Paint 20L (White)', emoji: '🎨', price: 12500, quantity: 15, unit: 'bucket', views: 95, inquiries: 4, date: '20 Apr 2026', status: 'draft' },
  { id: 'LST-008', title: 'Wooden Door (Solid Teak)', emoji: '🚪', price: 45000, quantity: 5, unit: 'piece', views: 203, inquiries: 9, date: '10 Apr 2026', status: 'sold' },
];

type InventoryItem = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  inStock: number;
  minStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  lastRestocked: string;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', title: 'Dangote Cement 42.5R (50kg)', emoji: '🏗️', category: 'Cement', inStock: 48, minStock: 20, unit: 'bag', costPrice: 6200, sellingPrice: 8500, lastRestocked: '2 Jun 2026' },
  { id: 'inv-2', title: 'Elephant Cement (50kg)', emoji: '🏗️', category: 'Cement', inStock: 12, minStock: 15, unit: 'bag', costPrice: 5900, sellingPrice: 8200, lastRestocked: '28 May 2026' },
  { id: 'inv-3', title: 'Iron Rod 12mm (6m)', emoji: '⚙️', category: 'Steel & Iron', inStock: 25, minStock: 10, unit: 'piece', costPrice: 5000, sellingPrice: 6800, lastRestocked: '25 May 2026' },
  { id: 'inv-4', title: 'Iron Rod 16mm (6m)', emoji: '⚙️', category: 'Steel & Iron', inStock: 8, minStock: 10, unit: 'piece', costPrice: 7200, sellingPrice: 9500, lastRestocked: '20 May 2026' },
  { id: 'inv-5', title: 'Ceramic Floor Tiles 60×60cm', emoji: '🏛️', category: 'Tiles', inStock: 85, minStock: 30, unit: 'box', costPrice: 2200, sellingPrice: 3500, lastRestocked: '15 May 2026' },
  { id: 'inv-6', title: 'Aluminum Roofing Sheet 0.5mm', emoji: '🏠', category: 'Roofing', inStock: 18, minStock: 10, unit: 'sheet', costPrice: 3100, sellingPrice: 4200, lastRestocked: '10 May 2026' },
  { id: 'inv-7', title: 'PVC Water Pipe 3/4 inch (9m)', emoji: '🔧', category: 'Plumbing', inStock: 3, minStock: 15, unit: 'piece', costPrice: 1900, sellingPrice: 2800, lastRestocked: '5 May 2026' },
  { id: 'inv-8', title: 'Emulsion Paint 20L (White)', emoji: '🎨', category: 'Paint', inStock: 14, minStock: 10, unit: 'bucket', costPrice: 9000, sellingPrice: 12500, lastRestocked: '20 Apr 2026' },
];

const FILTERS = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'active', label: 'Active', icon: 'check-circle' },
  { key: 'draft', label: 'Drafts', icon: 'edit-note' },
  { key: 'sold', label: 'Sold', icon: 'sell' },
] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: Colors.primary, bg: Colors.primary + '18' },
  draft: { label: 'Draft', color: Colors.amber, bg: Colors.amber + '18' },
  sold: { label: 'Sold', color: Colors.secondary, bg: Colors.secondary + '18' },
};

const TABS = [
  { key: 'listings', icon: 'storefront', label: 'Listings' },
  { key: 'inventory', icon: 'inventory-2', label: 'Inventory' },
] as const;

const todaysDate = () =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/,/g, '');

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

type DropdownOption = { label: string; value: string };

function InventoryCard({
  item, index, onUpdateStock, onRemove, onRestock,
}: {
  item: InventoryItem;
  index: number;
  onUpdateStock: (item: InventoryItem, delta: number) => void;
  onRemove: (item: InventoryItem) => void;
  onRestock: (item: InventoryItem) => void;
}) {
  const isLow = item.inStock <= item.minStock;
  const margin = item.costPrice > 0 ? ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(0) : '0';
  const stockRatio = Math.min(item.inStock / item.minStock, 2);
  const barColor = isLow ? Colors.error : stockRatio >= 1.5 ? Colors.primaryGreen : Colors.amber;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.invCard}>
        <View style={styles.invCardLeft}>
          <View style={[styles.invEmojiBadge, isLow && { backgroundColor: Colors.error + '15' }]}>
            <Text style={styles.invEmoji}>{item.emoji}</Text>
          </View>
          <View style={[styles.stockDot, { backgroundColor: barColor }]} />
        </View>
        <View style={styles.invCardBody}>
          <View style={styles.invCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.invCategory}>{item.category}</Text>
            </View>
            <TouchableOpacity style={styles.invDeleteBtn} activeOpacity={0.6} onPress={() => onRemove(item)}>
              <MaterialIcons name="delete-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.stockBarTrack}>
            <View style={[styles.stockBarFill, { width: `${Math.min(stockRatio * 50, 100)}%`, backgroundColor: barColor }]} />
          </View>

          <View style={styles.invMetrics}>
            <View style={styles.invMetric}>
              <Text style={styles.invMetricLabel}>In Stock</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={[styles.invMetricValue, isLow && { color: Colors.error }]}>{item.inStock}</Text>
                <Text style={styles.invMetricUnit}>/ {item.minStock}</Text>
              </View>
            </View>
            <View style={styles.invMetric}>
              <Text style={styles.invMetricLabel}>Price</Text>
              <Text style={styles.invMetricValue}>{formatPrice(item.sellingPrice)}</Text>
            </View>
            <View style={styles.invMetric}>
              <Text style={styles.invMetricLabel}>Margin</Text>
              <Text style={[styles.invMetricValue, { color: Colors.primaryGreen }]}>{margin}%</Text>
            </View>
          </View>

          <View style={styles.invActions}>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateStock(item, -1)} activeOpacity={0.6}>
                <MaterialIcons name="remove" size={13} color={Colors.textMedium} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.inStock}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateStock(item, 1)} activeOpacity={0.6}>
                <MaterialIcons name="add" size={13} color={Colors.textMedium} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.restockBtn}
              onPress={() => onRestock(item)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="restart-alt" size={13} color={Colors.primary} />
              <Text style={styles.restockBtnLabel}>Restock</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.invDate}>Last restocked: {item.lastRestocked}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function MyListingsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'listings' | 'inventory'>('listings');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [showAddModal, setShowAddModal] = useState(false);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTarget, setRestockTarget] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState('');

  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addCostPrice, setAddCostPrice] = useState('');
  const [addMinStock, setAddMinStock] = useState('');

  const catBtnRef = useRef<View>(null!) as React.RefObject<View>;
  const prodBtnRef = useRef<View>(null!) as React.RefObject<View>;
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const catSlideAnim = useRef(new Animated.Value(0)).current;
  const prodSlideAnim = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return MY_LISTINGS;
    return MY_LISTINGS.filter((l) => l.status === activeFilter);
  }, [activeFilter]);

  const lowStock = useMemo(() => inventory.filter((i) => i.inStock <= i.minStock), [inventory]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter((i) => i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  const onRefresh = useMemo(() => () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const inventoryStats = useMemo(() => {
    const totalItems = inventory.reduce((s, i) => s + i.inStock, 0);
    const totalCost = inventory.reduce((s, i) => s + i.costPrice * i.inStock, 0);
    const totalValue = inventory.reduce((s, i) => s + i.sellingPrice * i.inStock, 0);
    const potentialProfit = totalValue - totalCost;
    return { totalItems, totalCost, totalValue, potentialProfit };
  }, [inventory]);

  const stats = useMemo(() => {
    const total = MY_LISTINGS.length;
    const active = MY_LISTINGS.filter((l) => l.status === 'active').length;
    const sold = MY_LISTINGS.filter((l) => l.status === 'sold').length;
    const totalValue = MY_LISTINGS.reduce((s, l) => s + l.price * l.quantity, 0);
    return { total, active, sold, totalValue };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(PRODUCTS.map((p) => p.category));
    return Array.from(cats).map((c) => ({ label: c, value: c }));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return PRODUCTS.filter((p) => p.category === selectedCategory).map((p) => ({
      label: p.name,
      value: p.id,
    }));
  }, [selectedCategory]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return PRODUCTS.find((p) => p.id === selectedProductId) ?? null;
  }, [selectedProductId]);

  const openDropdown = (ref: React.RefObject<View>, setOpen: (v: boolean) => void, anim: Animated.Value) => {
    ref.current?.measureInWindow((x, y, w) => {
      setDropdownPos({ top: y + 32, left: x, width: w });
      setOpen(true);
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const resetAddForm = () => {
    setSelectedCategory('');
    setSelectedProductId('');
    setAddQty('');
    setAddCostPrice('');
    setAddMinStock('');
  };

  const handleAddToInventory = () => {
    if (!selectedProduct || !addQty || !addCostPrice) {
      Alert.alert('Missing Fields', 'Please select a product, quantity, and cost price.');
      return;
    }
    const existing = inventory.find((i) => i.title === selectedProduct.name);
    if (existing) {
      setInventory((prev) =>
        prev.map((i) =>
          i.title === selectedProduct.name
            ? { ...i, inStock: i.inStock + Number(addQty), costPrice: Number(addCostPrice), lastRestocked: todaysDate() }
            : i
        )
      );
    } else {
      const newItem: InventoryItem = {
        id: 'inv-' + Date.now(),
        title: selectedProduct.name,
        emoji: selectedProduct.imageEmoji,
        category: selectedProduct.category,
        inStock: Number(addQty),
        minStock: Number(addMinStock) || 10,
        unit: selectedProduct.unit,
        costPrice: Number(addCostPrice),
        sellingPrice: selectedProduct.price,
        lastRestocked: todaysDate(),
      };
      setInventory((prev) => [...prev, newItem]);
    }
    setShowAddModal(false);
    resetAddForm();
  };

  const handleRemoveItem = (item: InventoryItem) => {
    Alert.alert('Remove from Inventory', `Remove "${item.title}" from your stock?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setInventory((prev) => prev.filter((i) => i.id !== item.id)) },
    ]);
  };

  const handleRestock = () => {
    if (!restockTarget || !restockQty) return;
    setInventory((prev) =>
      prev.map((i) =>
        i.id === restockTarget.id
          ? { ...i, inStock: i.inStock + Number(restockQty), lastRestocked: todaysDate() }
          : i
      )
    );
    setShowRestockModal(false);
    setRestockTarget(null);
    setRestockQty('');
  };

  useEffect(() => {
    if (!showAddModal) {
      setCatDropdownOpen(false);
      setProdDropdownOpen(false);
      resetAddForm();
    }
  }, [showAddModal]);

  useEffect(() => {
    setSelectedProductId('');
  }, [selectedCategory]);

  const handleUpdateStock = (item: InventoryItem, delta: number) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, inStock: Math.max(0, i.inStock + delta) } : i
      )
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}>
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'My Store' }} />

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => { setActiveTab(tab.key); setActiveFilter('all'); }} activeOpacity={0.7}>
            <MaterialIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? Colors.primaryGreen : Colors.textLight} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'listings' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNum}>{stats.total}</Text>
                  <Text style={styles.statLbl}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: Colors.primary }]}>{stats.active}</Text>
                  <Text style={styles.statLbl}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: Colors.secondary }]}>{stats.sold}</Text>
                  <Text style={styles.statLbl}>Sold</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: Colors.primaryGreen, fontSize: 13 }]}>{formatPrice(stats.totalValue)}</Text>
                  <Text style={styles.statLbl}>Value</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => router.push('/add-listing')}>
                <MaterialIcons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add New Listing</Text>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
                {FILTERS.map((f) => {
                  const active = activeFilter === f.key;
                  return (
                    <TouchableOpacity key={f.key} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => setActiveFilter(f.key)} activeOpacity={0.7}>
                      <MaterialIcons name={f.icon as any} size={14} color={active ? '#fff' : Colors.textMedium} />
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status];
            return (
              <TouchableOpacity style={styles.card} activeOpacity={0.8}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardPrice}>{formatPrice(item.price)} <Text style={styles.cardPerUnit}>/ {item.unit}</Text></Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="inventory-2" size={12} color={Colors.textLight} />
                      <Text style={styles.metaText}>{item.quantity} {item.unit}(s)</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="visibility" size={12} color={Colors.textLight} />
                      <Text style={styles.metaText}>{item.views} views</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialIcons name="forum" size={12} color={Colors.textLight} />
                      <Text style={styles.metaText}>{item.inquiries} inquiries</Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardDate}>{item.date}</Text>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
                        <MaterialIcons name="edit" size={15} color={Colors.textMedium} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => Alert.alert('Delete', 'Are you sure you want to delete this listing?')}>
                        <MaterialIcons name="delete-outline" size={15} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons name="storefront" size={44} color={Colors.border} />
              </View>
              <Text style={styles.emptyTitle}>No {activeFilter !== 'all' ? activeFilter : ''} listings</Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'all' ? 'Start selling by adding your first listing' : `You have no ${activeFilter} listings`}
              </Text>
              {activeFilter !== 'all' && (
                <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setActiveFilter('all')}>
                  <Text style={styles.clearFilterText}>Clear filter</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredInventory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: 140 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListHeaderComponent={
              <>
                <View style={styles.invStatsRow}>
                  <View style={styles.invStatCard}>
                    <Text style={styles.invStatNum}>{inventoryStats.totalItems}</Text>
                    <Text style={styles.invStatLabel}>Total Units</Text>
                  </View>
                  <View style={styles.invStatCard}>
                    <Text style={styles.invStatNum}>{formatPrice(inventoryStats.totalCost)}</Text>
                    <Text style={styles.invStatLabel}>Cost</Text>
                  </View>
                  <View style={[styles.invStatCard, { borderColor: Colors.primaryGreen + '30', borderWidth: 1 }]}>
                    <Text style={[styles.invStatNum, { color: Colors.primaryGreen }]}>{formatPrice(inventoryStats.potentialProfit)}</Text>
                    <Text style={styles.invStatLabel}>Profit</Text>
                  </View>
                </View>

                {lowStock.length > 0 && (
                  <View style={styles.alertBanner}>
                    <MaterialIcons name="warning" size={18} color={Colors.error} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>{lowStock.length} product{lowStock.length > 1 ? 's' : ''} low in stock</Text>
                      <Text style={styles.alertText}>Restock soon to avoid running out</Text>
                    </View>
                  </View>
                )}

                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={18} color={Colors.textLight} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.6}>
                      <MaterialIcons name="close" size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.sectionRow}>
                  <Text style={styles.sectionHeader}>All Products</Text>
                  <Text style={styles.sectionCount}>{filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''}</Text>
                </View>
              </>
            }
            renderItem={({ item, index }) => (
              <InventoryCard
                item={item}
                index={index}
                onUpdateStock={handleUpdateStock}
                onRemove={handleRemoveItem}
                onRestock={(i) => { setRestockTarget(i); setRestockQty(''); setShowRestockModal(true); }}
              />
            )}
            ListFooterComponent={<View style={{ height: 20 }} />}
          />

          <TouchableOpacity
            style={[styles.fab, { bottom: 86 + insets.bottom }]}
            activeOpacity={0.85}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.fabLabel}>Add to Stock</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add to Stock Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Stock</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={22} color={Colors.textMedium} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Category Dropdown */}
              <Text style={styles.inputLabel}>Category</Text>
              <View ref={catBtnRef} collapsable={false}>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => openDropdown(catBtnRef, setCatDropdownOpen, catSlideAnim)} activeOpacity={0.7}>
                  <Text style={[styles.dropdownText, !selectedCategory && { color: Colors.textMuted }]}>
                    {selectedCategory || 'Select category'}
                  </Text>
                  <MaterialIcons name="unfold-more" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              {/* Product Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Product</Text>
              <View ref={prodBtnRef} collapsable={false}>
                <TouchableOpacity
                  style={[styles.dropdownBtn, !selectedCategory && { opacity: 0.4 }]}
                  onPress={() => selectedCategory && openDropdown(prodBtnRef, setProdDropdownOpen, prodSlideAnim)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, !selectedProductId && { color: Colors.textMuted }]} numberOfLines={1}>
                    {selectedProduct ? selectedProduct.name : 'Select product'}
                  </Text>
                  <MaterialIcons name="unfold-more" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              {selectedProduct && (
                <View style={styles.selectedPreview}>
                  <Text style={styles.selectedPreviewEmoji}>{selectedProduct.imageEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedPreviewName}>{selectedProduct.name}</Text>
                    <Text style={styles.selectedPreviewDetail}>
                      {formatPrice(selectedProduct.price)} / {selectedProduct.unit}  •  {selectedProduct.category}
                    </Text>
                  </View>
                </View>
              )}

              {/* Quantity */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={addQty}
                onChangeText={setAddQty}
              />

              {/* Cost Price */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Cost Price (per unit)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 6200"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={addCostPrice}
                onChangeText={setAddCostPrice}
              />

              {/* Min Stock */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Minimum Stock Level</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 20"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={addMinStock}
                onChangeText={setAddMinStock}
              />

              <TouchableOpacity style={styles.modalSubmit} activeOpacity={0.7} onPress={handleAddToInventory}>
                <MaterialIcons name="inventory-2" size={18} color="#fff" />
                <Text style={styles.modalSubmitText}>Add to Stock</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Dropdown Overlay */}
      <Modal visible={catDropdownOpen} transparent onRequestClose={() => setCatDropdownOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCatDropdownOpen(false)}>
          <Animated.View style={[styles.dropdownOverlay, { top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, opacity: catSlideAnim }]}>
            <ScrollView style={{ maxHeight: 200 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.dropdownItem, selectedCategory === cat.value && styles.dropdownItemActive]}
                  onPress={() => { setSelectedCategory(cat.value); setCatDropdownOpen(false); }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.dropdownItemText, selectedCategory === cat.value && styles.dropdownItemTextActive]}>{cat.label}</Text>
                  {selectedCategory === cat.value && <MaterialIcons name="check" size={16} color={Colors.primaryGreen} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Product Dropdown Overlay */}
      <Modal visible={prodDropdownOpen} transparent onRequestClose={() => setProdDropdownOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setProdDropdownOpen(false)}>
          <Animated.View style={[styles.dropdownOverlay, { top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, opacity: prodSlideAnim }]}>
            <ScrollView style={{ maxHeight: 220 }}>
              {filteredProducts.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.dropdownItem, selectedProductId === p.value && styles.dropdownItemActive]}
                  onPress={() => { setSelectedProductId(p.value); setProdDropdownOpen(false); }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.dropdownItemText, selectedProductId === p.value && styles.dropdownItemTextActive]} numberOfLines={1}>{p.label}</Text>
                  {selectedProductId === p.value && <MaterialIcons name="check" size={16} color={Colors.primaryGreen} />}
                </TouchableOpacity>
              ))}
              {filteredProducts.length === 0 && (
                <Text style={styles.dropdownEmpty}>No products in this category</Text>
              )}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Restock Modal */}
      <Modal visible={showRestockModal} transparent animationType="fade" onRequestClose={() => setShowRestockModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 320, alignSelf: 'center' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Restock</Text>
              <TouchableOpacity onPress={() => setShowRestockModal(false)}>
                <MaterialIcons name="close" size={22} color={Colors.textMedium} />
              </TouchableOpacity>
            </View>
            {restockTarget && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Text style={{ fontSize: 24 }}>{restockTarget.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textDark, flex: 1 }}>{restockTarget.title}</Text>
                </View>
                <Text style={styles.inputLabel}>Current stock: {restockTarget.inStock} {restockTarget.unit}(s)</Text>
                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Add quantity</Text>
                <TextInput
                  style={[styles.input, { fontSize: 20, fontWeight: '800', textAlign: 'center' }]}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  value={restockQty}
                  onChangeText={setRestockQty}
                />
                <TouchableOpacity style={[styles.modalSubmit, { marginTop: 16 }]} activeOpacity={0.7} onPress={handleRestock}>
                  <MaterialIcons name="restart-alt" size={18} color="#fff" />
                  <Text style={styles.modalSubmitText}>Confirm Restock</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20, paddingBottom: 32 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.primaryGreen + '12',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  tabLabelActive: {
    color: Colors.primaryGreen,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  filterRow: { marginBottom: 16 },
  filterContent: { gap: 8 },
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
  },
  filterChipActive: {
    backgroundColor: Colors.primaryGreen,
    borderColor: Colors.primaryGreen,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textMedium },
  filterChipTextActive: { color: '#fff' },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardLeft: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryGreen,
    marginTop: 2,
  },
  cardPerUnit: { fontSize: 11, fontWeight: '500', color: Colors.textLight },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: Colors.textLight, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardDate: { fontSize: 10, color: Colors.textMuted },
  actionBtns: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },

  invStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  invStatCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  invStatNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  invStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.error + '0d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  alertText: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
    paddingVertical: 0,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
  },

  invCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    gap: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  invCardLeft: {
    alignItems: 'center',
    gap: 5,
    paddingTop: 2,
  },
  invEmojiBadge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: Colors.primaryGreen + '0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invEmoji: { fontSize: 22 },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  invCardBody: { flex: 1 },
  invCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  invCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  invDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stockBarTrack: {
    height: 4,
    backgroundColor: Colors.outlineVariant + '50',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  invMetrics: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  invMetric: {
    flex: 1,
    gap: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  invMetricLabel: {
    fontSize: 8,
    color: Colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  invMetricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  invMetricUnit: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  invActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qtyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '60',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
    minWidth: 24,
    textAlign: 'center',
  },
  restockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '0d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  restockBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  invDate: {
    fontSize: 9,
    color: Colors.textMuted,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMedium,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryGreen + '0d',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  dropdownItemTextActive: {
    color: Colors.primaryGreen,
    fontWeight: '700',
  },
  dropdownEmpty: {
    padding: 14,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryGreen + '0a',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  selectedPreviewEmoji: { fontSize: 26 },
  selectedPreviewName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  selectedPreviewDetail: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 1,
  },
  modalSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },

  fab: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  emptySub: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingHorizontal: 40 },
  clearFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  clearFilterText: { fontSize: 12, fontWeight: '600', color: Colors.textMedium },
});
