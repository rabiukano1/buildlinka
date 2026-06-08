import { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { PRODUCTS } from '../../constants/MockData';
import { useCart } from '../../contexts/CartContext';
import { MediaViewer } from '../../components/MediaViewer';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const SIMILAR_PRODUCTS = PRODUCTS.filter((p) => p.badge).slice(0, 3);

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');

  const product = PRODUCTS.find((p) => p.id === id);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={Colors.border} />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    addItem(product, qty);
    Alert.alert('Added to Cart', `${qty} × ${product.name} added to your cart.`);
  };

  const handleContact = () => {
    Alert.alert('Contact Vendor', `Messaging ${product.vendor}...`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: product.name.length > 22 ? product.name.substring(0, 20) + '...' : product.name,
          headerTintColor: Colors.primaryGreen,
        }}
      />
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGreen} />
          }
        >
          {/* ─── Image hero ─── */}
          <LinearGradient
            colors={[Colors.greenTint, '#C8E6C9', Colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageSection}
          >
            <View style={[styles.heroCircle, styles.heroCircle1]} />
            <View style={[styles.heroCircle, styles.heroCircle2]} />
            {product.imageUrl ? (
              <MediaViewer uri={product.imageUrl} style={styles.productImage} contentFit="cover" priority="high" />
            ) : (
              <Text style={styles.productEmoji}>{product.imageEmoji}</Text>
            )}
            <View style={styles.heroBadgeRow}>
              {product.badge && (
                <View style={[styles.heroBadge, product.badge === 'Best Seller' && styles.heroBadgeOrange]}>
                  <Text style={styles.heroBadgeText}>{product.badge}</Text>
                </View>
              )}
              <View style={styles.heroBadgeOutline}>
                <MaterialIcons name="visibility" size={12} color={Colors.textLight} />
                <Text style={styles.heroBadgeOutlineText}>23 watching</Text>
              </View>
            </View>
            {!product.inStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Currently Out of Stock</Text>
              </View>
            )}
          </LinearGradient>

          {/* ─── Info card ─── */}
          <View style={styles.infoCard}>
            <Text style={styles.productName}>{product.name}</Text>

            {/* Vendor badge */}
            <TouchableOpacity style={styles.vendorBadge}>
              <View style={styles.vendorBadgeIcon}>
                <MaterialIcons name="store" size={16} color={Colors.primaryGreen} />
              </View>
              <View style={styles.vendorBadgeInfo}>
                <Text style={styles.vendorBadgeLabel}>Sold by</Text>
                <Text style={styles.vendorBadgeName}>{product.vendor}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={Colors.border} />
            </TouchableOpacity>

            {/* Rating */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons
                  key={star}
                  name="star"
                  size={18}
                  color={star <= Math.round(product.rating) ? Colors.amber : Colors.border}
                />
              ))}
              <Text style={styles.ratingValue}>{product.rating}</Text>
              <Text style={styles.ratingCount}>({product.reviewCount} reviews)</Text>
            </View>

            {/* Location */}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
              <Text style={styles.locationText}>{product.vendorLocation}</Text>
            </View>
          </View>

          {/* ─── Price + Stock card ─── */}
          <View style={styles.priceCard}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              <Text style={styles.priceUnit}>per {product.unit}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Delivery</Text>
              <Text style={styles.priceSub}>₦2,500</Text>
              <Text style={styles.priceUnit}>within Lagos</Text>
            </View>
          </View>

          {/* ─── Quantity ─── */}
          <View style={styles.qtyCard}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                onPress={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <MaterialIcons name="remove" size={20} color={qty <= 1 ? Colors.border : Colors.textDark} />
              </TouchableOpacity>
              <View style={styles.qtyValue}>
                <Text style={styles.qtyText}>{qty}</Text>
              </View>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
                <MaterialIcons name="add" size={20} color={Colors.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Tabs ─── */}
          <View style={styles.tabsCard}>
            <View style={styles.tabRow}>
              {(['description', 'reviews', 'shipping'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'description' ? 'Details' : tab === 'reviews' ? `Reviews (${product.reviewCount})` : 'Shipping'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tabContent}>
              {activeTab === 'description' && (
                <Text style={styles.tabBody}>
                  High-quality {product.name.toLowerCase()} sourced directly from trusted manufacturers
                  and suppliers across Nigeria. Suitable for residential and commercial construction
                  projects. Meets all NIS quality standards.
                </Text>
              )}
              {activeTab === 'reviews' && (
                <View style={styles.tabPlaceholder}>
                  <MaterialIcons name="rate-review" size={32} color={Colors.border} />
                  <Text style={styles.tabPlaceholderText}>Reviews coming soon</Text>
                </View>
              )}
              {activeTab === 'shipping' && (
                <View style={styles.tabPlaceholder}>
                  <MaterialIcons name="local-shipping" size={32} color={Colors.border} />
                  <Text style={styles.tabPlaceholderText}>Shipping details coming soon</Text>
                </View>
              )}
            </View>
          </View>

          {/* ─── Similar products ─── */}
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>You May Also Like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
              {SIMILAR_PRODUCTS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.similarCard}
                  onPress={() => router.replace(`/product/${p.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.similarEmojiBox}>
                    <Text style={styles.similarEmoji}>{p.imageEmoji}</Text>
                  </View>
                  <Text style={styles.similarName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.similarPrice}>{formatPrice(p.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* ─── Bottom action bar ─── */}
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.wishlistBtn}>
            <MaterialIcons name="favorite-border" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addToCartBtn, !product.inStock && styles.disabledBtn]}
            onPress={handleAddToCart}
            disabled={!product.inStock}
          >
            <MaterialIcons name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>
              {product.inStock ? `Add to Cart — ${formatPrice(product.price * qty)}` : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <MaterialIcons name="chat" size={20} color={Colors.primaryGreen} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },

  /* ─── Error ─── */
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* ─── Image hero ─── */
  imageSection: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(46,125,50,0.06)',
  },
  heroCircle1: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
  },
  heroCircle2: {
    width: 140,
    height: 140,
    bottom: -40,
    left: -40,
  },
  productEmoji: {
    fontSize: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeOrange: {
    backgroundColor: Colors.secondary,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBadgeOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeOutlineText: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  /* ─── Info card ─── */
  infoCard: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 20,
    gap: 12,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 28,
  },
  vendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  vendorBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorBadgeInfo: {
    flex: 1,
    gap: 1,
  },
  vendorBadgeLabel: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  vendorBadgeName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textDark,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12.5,
    color: Colors.textLight,
  },

  /* ─── Price card ─── */
  priceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 20,
    marginTop: 12,
    marginHorizontal: 0,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priceCol: {
    flex: 1,
    gap: 2,
  },
  priceDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  priceLabel: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primaryGreen,
  },
  priceSub: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  priceUnit: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  /* ─── Quantity ─── */
  qtyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    backgroundColor: Colors.divider,
  },
  qtyValue: {
    minWidth: 40,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  qtyText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },

  /* ─── Tabs ─── */
  tabsCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: Colors.primaryGreen,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryGreen,
    fontWeight: '700',
  },
  tabContent: {
    padding: 18,
    minHeight: 80,
  },
  tabBody: {
    fontSize: 13.5,
    color: Colors.textLight,
    lineHeight: 21,
  },
  tabPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabPlaceholderText: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  /* ─── Similar ─── */
  similarSection: {
    marginTop: 20,
  },
  similarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  similarScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  similarCard: {
    width: 130,
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
  },
  similarEmojiBox: {
    height: 90,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarEmoji: { fontSize: 36 },
  similarName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.textDark,
    padding: 8,
    paddingBottom: 2,
    lineHeight: 15,
  },
  similarPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryGreen,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  bottomSpacer: {
    height: 100,
  },

  /* ─── Action bar ─── */
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  wishlistBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingVertical: 13,
  },
  disabledBtn: {
    backgroundColor: Colors.border,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  contactBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
