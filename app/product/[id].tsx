import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Colors } from '../../constants/Colors';
import { formatPrice, goBackOrHome } from '../../lib/backend';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import { MediaViewer } from '../../components/MediaViewer';
import { Image } from 'expo-image';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();
  const [qty, setQty] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'shipping'>('description');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const product = useQuery(api.products.get, { id: id as Id<'products'> });
  const relatedRows = useQuery(api.products.list, product ? { category: product.category } : 'skip');
  const related = (relatedRows ?? []).filter((p) => p._id !== product?._id).slice(0, 6);
  const reviewSummary = useQuery(api.reviews.summary, id ? { targetType: 'product' as const, targetId: id } : 'skip');
  const reviewRows = useQuery(api.reviews.byTarget, id ? { targetType: 'product' as const, targetId: id, limit: 4 } : 'skip');
  const canReview = useQuery(api.reviews.canReview, id ? { targetType: 'product' as const, targetId: id } : 'skip');
  const createReview = useMutation(api.reviews.create);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const submitReview = async () => {
    if (!canReview?.allowed || reviewRating < 1) {
      Alert.alert('Choose a rating', 'Tap a star before posting your review.');
      return;
    }
    setSavingReview(true);
    try {
      await createReview({
        targetType: 'product',
        targetId: id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        orderId: canReview.reference ? canReview.reference as Id<'orders'> : undefined,
      });
      setReviewOpen(false);
      setReviewRating(0);
      setReviewComment('');
      Alert.alert('Review posted', 'Thanks for your feedback.');
    } catch (err) {
      Alert.alert('Could not post review', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingReview(false);
    }
  };

  if (product === undefined) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={Colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading product…</Text>
      </View>
    );
  }

  if (product === null) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={Colors.border} />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => goBackOrHome()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inStock = product.stock > 0;
  const saved = isSaved(product._id);

  const handleAddToCart = () => {
    addItem(product, qty);
    Alert.alert('Added to Cart', `${qty} × ${product.name} added to your cart.`);
  };

  const handleContact = () => {
    Alert.alert('Contact Vendor', `Messaging ${product.storeName}...`);
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
            {product.photoUrls[0] ? (
              <MediaViewer uri={product.photoUrls[0]} style={styles.productImage} contentFit="cover" priority="high" />
            ) : (
              <Text style={styles.productEmoji}>📦</Text>
            )}
            <View style={styles.heroBadgeRow}>
              {product.storeVerified && (
                <View style={styles.heroBadge}>
                  <MaterialIcons name="verified" size={12} color="#fff" />
                  <Text style={styles.heroBadgeText}>Verified seller</Text>
                </View>
              )}
            </View>
            {!inStock && (
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
                <View style={styles.vendorNameRow}>
                  <Text style={styles.vendorBadgeName}>{product.storeName}</Text>
                  {product.storeVerified && <MaterialIcons name="verified" size={14} color={Colors.primaryGreen} />}
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={Colors.border} />
            </TouchableOpacity>

            {/* Location */}
            {!!product.storeLocation && (
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
                <Text style={styles.locationText}>{product.storeLocation}</Text>
              </View>
            )}
            <View style={styles.locationRow}>
              <MaterialIcons name="inventory-2" size={14} color={Colors.textMuted} />
              <Text style={styles.locationText}>
                {inStock ? `${product.stock.toLocaleString('en-NG')} in stock` : 'Out of stock'} · per {product.unit}
              </Text>
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
              {(['description', 'shipping'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'description' ? 'Details' : 'Shipping'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tabContent}>
              {activeTab === 'description' && (
                <Text style={styles.tabBody}>
                  {product.description || `High-quality ${product.name.toLowerCase()} sourced directly from trusted manufacturers and suppliers across Nigeria.`}
                </Text>
              )}
              {activeTab === 'shipping' && (
                <View style={styles.tabPlaceholder}>
                  <MaterialIcons name="local-shipping" size={32} color={Colors.border} />
                  <Text style={styles.tabPlaceholderText}>Shipping details coming soon</Text>
                </View>
              )}
            </View>
          </View>

          {/* ─── Reviews ─── */}
          <View style={styles.reviewsCard}>
            <View style={styles.reviewsHead}>
              <View>
                <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                <View style={styles.reviewsScoreRow}>
                  <Text style={styles.reviewsScore}>{(reviewSummary?.average ?? 0).toFixed(1)}</Text>
                  <View style={styles.reviewsStars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <MaterialIcons key={n} name={n <= Math.round(reviewSummary?.average ?? 0) ? 'star' : 'star-border'} size={15} color="#F9A825" />
                    ))}
                  </View>
                  <Text style={styles.reviewsCount}>({reviewSummary?.count ?? 0})</Text>
                </View>
              </View>
              {canReview?.allowed ? (
                <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setReviewOpen(true)}>
                  <Text style={styles.writeReviewText}>Write review</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.reviewHint} numberOfLines={2}>{canReview?.reason ?? ''}</Text>
              )}
            </View>
            {reviewRows === undefined ? (
              <ActivityIndicator color={Colors.primaryGreen} style={{ paddingVertical: 12 }} />
            ) : reviewRows.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Buyers can review after delivery.</Text>
            ) : reviewRows.map((r) => (
              <View key={r._id} style={styles.reviewRow}>
                <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{r.authorName.charAt(0).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                    <View style={styles.reviewsStars}>
                      {[1, 2, 3, 4, 5].map((n) => <MaterialIcons key={n} name={n <= r.rating ? 'star' : 'star-border'} size={12} color="#F9A825" />)}
                    </View>
                  </View>
                  {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                  {r.reply && (
                    <View style={styles.reviewReply}>
                      <Text style={styles.reviewReplyLabel}>Vendor reply</Text>
                      <Text style={styles.reviewReplyText}>{r.reply}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* ─── Similar products ─── */}
          {related.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.similarTitle}>You May Also Like</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
                {related.map((p) => (
                  <TouchableOpacity
                    key={p._id}
                    style={styles.similarCard}
                    onPress={() => router.replace(`/product/${p._id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.similarEmojiBox}>
                      {p.photoUrls[0] ? (
                        <Image source={{ uri: p.photoUrls[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <Text style={styles.similarEmoji}>📦</Text>
                      )}
                    </View>
                    <Text style={styles.similarName} numberOfLines={2}>{p.name}</Text>
                    <Text style={styles.similarPrice}>{formatPrice(p.price)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* ─── Bottom action bar ─── */}
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.wishlistBtn} onPress={() => toggleSave(product)} accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}>
            <MaterialIcons name={saved ? 'favorite' : 'favorite-border'} size={22} color={saved ? Colors.secondary : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addToCartBtn, !inStock && styles.disabledBtn]}
            onPress={handleAddToCart}
            disabled={!inStock}
          >
            <MaterialIcons name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>
              {inStock ? `Add to Cart — ${formatPrice(product.price * qty)}` : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <MaterialIcons name="chat" size={20} color={Colors.primaryGreen} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={reviewOpen} transparent animationType="slide" onRequestClose={() => setReviewOpen(false)}>
        <View style={styles.reviewModalWrap}>
          <View style={styles.reviewSheet}>
            <View style={styles.reviewSheetHead}>
              <Text style={styles.reviewsTitle}>Rate this product</Text>
              <TouchableOpacity onPress={() => setReviewOpen(false)} hitSlop={8}><MaterialIcons name="close" size={22} color={Colors.textMuted} /></TouchableOpacity>
            </View>
            <View style={styles.reviewStarPicker}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewRating(n)} hitSlop={6}>
                  <MaterialIcons name={n <= reviewRating ? 'star' : 'star-border'} size={38} color="#F9A825" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="How was the quality and delivery? (optional)"
              placeholderTextColor={Colors.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
            />
            <TouchableOpacity style={[styles.reviewSubmit, savingReview && { opacity: 0.6 }]} onPress={submitReview} disabled={savingReview}>
              {savingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.reviewSubmitText}>Post review</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    fontSize: 15,
    color: Colors.textMuted,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorBadgeName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textDark,
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

  /* ─── Reviews ─── */
  reviewsCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginTop: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 },
  reviewsTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark },
  reviewsScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  reviewsScore: { fontSize: 22, fontWeight: '900', color: Colors.textDark },
  reviewsStars: { flexDirection: 'row', gap: 1 },
  reviewsCount: { fontSize: 12, color: Colors.textMuted },
  writeReviewBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.primaryGreen },
  writeReviewText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  reviewHint: { flex: 1, fontSize: 10.5, color: Colors.textMuted, textAlign: 'right' },
  noReviews: { fontSize: 12.5, color: Colors.textMuted, paddingVertical: 8 },
  reviewRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.divider },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.primaryGreen },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  reviewComment: { fontSize: 12.5, color: Colors.textLight, lineHeight: 18, marginTop: 3 },
  reviewReply: { marginTop: 8, padding: 8, borderRadius: 6, backgroundColor: Colors.surfaceVariant },
  reviewReplyLabel: { fontSize: 9.5, fontWeight: '700', color: Colors.primaryGreen, textTransform: 'uppercase', letterSpacing: 0.4 },
  reviewReplyText: { fontSize: 11.5, color: Colors.textLight, marginTop: 2, lineHeight: 16 },
  reviewModalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  reviewSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  reviewSheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewStarPicker: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 16 },
  reviewInput: { minHeight: 96, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.textDark, fontSize: 14, textAlignVertical: 'top' },
  reviewSubmit: { height: 48, borderRadius: 99, backgroundColor: Colors.primaryGreen, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  reviewSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },

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
    overflow: 'hidden',
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
