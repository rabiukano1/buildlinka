import { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import {
  CATEGORIES,
  PRODUCTS,
  WORKERS,
  VENDORS,
  type Product,
  type Worker,
  type Vendor,
} from '../../constants/MockData';
import KeyboardAwareWrapper from '../../components/KeyboardAwareWrapper';
import { useCart } from '../../contexts/CartContext';
import { useSaved } from '../../contexts/SavedItemsContext';
import { useNotifications } from '../../contexts/NotificationContext';
import SearchBar from '../../components/SearchBar';
import CategoryCard from '../../components/CategoryCard';
import ProductCard from '../../components/ProductCard';
import FeaturedBanner from '../../components/FeaturedBanner';

const { width } = Dimensions.get('window');

const VISIBLE_CATEGORIES = 8;

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity style={styles.sectionAction} onPress={onAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.primaryGreen} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function MiniVendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <TouchableOpacity style={styles.miniVendor} activeOpacity={0.7}>
      <View style={styles.miniVendorEmojiBox}>
        <Text style={styles.miniVendorEmoji}>{vendor.emoji}</Text>
      </View>
      <Text style={styles.miniVendorName} numberOfLines={1}>{vendor.name}</Text>
      <View style={styles.miniVendorRating}>
        <MaterialIcons name="star" size={10} color={Colors.amber} />
        <Text style={styles.miniVendorRatingText}>{vendor.rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

function WorkerMiniCard({ worker }: { worker: Worker }) {
  return (
    <TouchableOpacity style={styles.workerMini} activeOpacity={0.8}>
      <View style={[styles.workerMiniAvatar, !worker.available && styles.workerMiniAvatarBusy]}>
        <Text style={styles.workerMiniEmoji}>{worker.avatar}</Text>
        <View style={[styles.workerMiniDot, worker.available ? styles.wDotGreen : styles.wDotRed]} />
      </View>
      <Text style={styles.workerMiniName} numberOfLines={1}>{worker.name}</Text>
      <Text style={styles.workerMiniTrade} numberOfLines={1}>{worker.trade}</Text>
      <View style={styles.workerMiniRateRow}>
        <Text style={styles.workerMiniRate}>₦{(worker.dailyRate / 1000).toFixed(0)}k</Text>
        <Text style={styles.workerMiniRateLabel}>/day</Text>
      </View>
      <TouchableOpacity style={styles.workerMiniHire} activeOpacity={0.7}>
        <Text style={styles.workerMiniHireText}>{worker.available ? 'Hire' : 'Busy'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const { isSaved, toggleSave } = useSaved();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const featuredProducts = PRODUCTS.filter((p) => p.badge);
  const displayedCategories = showAllCats ? CATEGORIES : CATEGORIES.slice(0, VISIBLE_CATEGORIES);
  const nearbyWorkers = WORKERS.filter((w) => w.location.includes('Lagos'));

  return (
    <View style={styles.wrapper}>
      <KeyboardAwareWrapper
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGreen} />
        }
      >
        {/* ─── Header ─── */}
        <FadeInSection>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={16} color={Colors.primaryGreen} />
                <Text style={styles.locationText}>Lagos, Nigeria</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.textLight} />
              </View>
              <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)}>
                <MaterialIcons name="notifications-none" size={24} color={Colors.textDark} />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.greetingSub}>Let's build something great today</Text>
          </View>
        </FadeInSection>

        {/* ─── Search ─── */}
        <FadeInSection delay={80}>
          <View style={styles.searchSection}>
            <SearchBar placeholder="Find materials, workers, services..." />
          </View>
        </FadeInSection>

        {/* ─── Hero Promo ─── */}
        <FadeInSection delay={160}>
          <TouchableOpacity activeOpacity={0.92} style={styles.heroCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>🇳🇬 Nigeria's #1</Text>
                </View>
                <Text style={styles.heroTitle}>Build Your Dream Project</Text>
                <Text style={styles.heroSub}>
                  Browse 2,000+ materials & hire trusted workers near you
                </Text>
                <View style={styles.heroActions}>
                  <View style={styles.heroBtn}>
                    <MaterialIcons name="shopping-bag" size={16} color="#ffffff" />
                    <Text style={styles.heroBtnText}>Shop Now</Text>
                  </View>
                  <View style={styles.heroBtnSecondary}>
                    <Text style={styles.heroBtnSecondaryText}>Learn More</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.heroDecoration}>🏗️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeInSection>

        {/* ─── Build Project ─── */}
        <FadeInSection delay={240}>
          <TouchableOpacity style={styles.buildCard} onPress={() => router.push('/build-project' as any)} activeOpacity={0.92}>
            <LinearGradient
              colors={['#6d5100', '#8a6a00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buildGradient}
            >
              <View style={styles.buildIconBox}>
                <MaterialIcons name="auto-awesome" size={22} color="#ffd54f" />
              </View>
              <View style={styles.buildContent}>
                <Text style={styles.buildTitle}>AI-Powered Build Project</Text>
                <Text style={styles.buildSub}>Get cost estimates, materials & workers in minutes</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        </FadeInSection>

        {/* ─── Categories ─── */}
        <FadeInSection delay={320}>
          <View style={styles.section}>
            <SectionHeader title="Categories" action={showAllCats ? 'Show Less' : `+${CATEGORIES.length - VISIBLE_CATEGORIES} More`} />
            <View style={styles.categoryGrid}>
              {displayedCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onPress={() => {
                    if (cat.name === 'Cement') { router.push('/category/cement'); }
                    else if (cat.name === 'Steel & Iron') { router.push('/category/steel-iron'); }
                    else if (cat.name === 'Roofing') { router.push('/category/roofing'); }
                    else if (cat.name === 'Electrical') { router.push('/category/electrical'); }
                    else if (cat.name === 'Plumbing') { router.push('/category/plumbing'); }
                    else if (cat.name === 'Tiles') { router.push('/category/tiles'); }
                    else if (cat.name === 'Timber') { router.push('/category/timber'); }
                    else if (cat.name === 'Equipment') { router.push('/category/equipment'); }
                    else if (cat.name === 'Glass') { router.push('/category/glass'); }
                    else if (cat.name === 'Paint') { router.push('/category/paint'); }
                    else if (cat.name === 'Blocks') { router.push('/category/blocks'); }
                    else {
                      router.push({
                        pathname: '/(tabs)/materials',
                        params: { category: cat.name },
                      });
                    }
                  }}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.categoryToggle}
              onPress={() => setShowAllCats(!showAllCats)}
            >
              <Text style={styles.categoryToggleText}>
                {showAllCats ? 'Show Less Categories' : `View All ${CATEGORIES.length} Categories`}
              </Text>
              <MaterialIcons
                name={showAllCats ? 'expand-less' : 'expand-more'}
                size={18}
                color={Colors.primaryGreen}
              />
            </TouchableOpacity>
          </View>
        </FadeInSection>

        {/* ─── Featured Banners ─── */}
        <FadeInSection delay={400}>
          <View style={styles.section}>
            <FeaturedBanner />
          </View>
        </FadeInSection>

        {/* ─── Today's Best Deals ─── */}
        <FadeInSection delay={480}>
          <View style={styles.section}>
            <SectionHeader title="Today's Best Deals" action="View All" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
              decelerationRate="fast"
              snapToInterval={172}
            >
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onPress={() => handleProductPress(p)}
                  onAddToCart={() => addItem(p)}
                  onToggleSave={() => toggleSave(p)}
                  isSaved={isSaved(p.id)}
                />
              ))}
            </ScrollView>
          </View>
        </FadeInSection>

        {/* ─── Popular Vendors ─── */}
        <FadeInSection delay={560}>
          <View style={styles.section}>
            <SectionHeader title="Popular Vendors" action="View All" onAction={() => router.push('/popular-vendors' as any)} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniVendorScroll}
            >
              {VENDORS.map((v) => (
                <MiniVendorCard key={v.id} vendor={v} />
              ))}
            </ScrollView>
          </View>
        </FadeInSection>

        {/* ─── Workers Near You ─── */}
        <FadeInSection delay={640}>
          <View style={styles.section}>
            <SectionHeader title="Workers Near You" action="View All" onAction={() => router.push('/nearby' as any)} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.workerScroll}
              decelerationRate="fast"
              snapToInterval={148}
            >
              {nearbyWorkers.map((w) => (
                <WorkerMiniCard key={w.id} worker={w} />
              ))}
            </ScrollView>
          </View>
        </FadeInSection>

        {/* ─── Bottom spacer ─── */}
        <View style={styles.bottomSpacer} />
      </KeyboardAwareWrapper>
    </View>
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
  contentContainer: {
    paddingBottom: 16,
  },

  /* ─── Header ─── */
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  notifBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.greenTint,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 28,
  },
  greetingSub: {
    fontSize: 13.5,
    color: Colors.textLight,
    marginTop: 2,
  },

  /* ─── Search ─── */
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },

  /* ─── Hero ─── */
  heroCard: {
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  heroGradient: {
    padding: 22,
    overflow: 'hidden',
    minHeight: 170,
    justifyContent: 'center',
  },
  heroContent: {
    gap: 8,
    zIndex: 2,
    maxWidth: '75%',
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  heroTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
  },
  heroSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 17,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroBtnSecondary: {
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  heroDecoration: {
    position: 'absolute',
    right: 10,
    bottom: -10,
    fontSize: 100,
    opacity: 0.2,
  },

  /* ─── Sections ─── */
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionText: {
    fontSize: 13,
    color: Colors.primaryGreen,
    fontWeight: '600',
  },

  /* ─── Build Project ─── */
  buildCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6d5100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buildGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  buildIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildContent: {
    flex: 1,
    gap: 2,
  },
  buildTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  buildSub: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 15,
  },

  /* ─── Categories ─── */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 4,
    rowGap: 18,
  },
  categoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    paddingVertical: 8,
    marginHorizontal: 20,
    backgroundColor: Colors.greenTint,
    borderRadius: 12,
  },
  categoryToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },

  /* ─── Products ─── */
  productsScroll: {
    paddingHorizontal: 20,
    gap: 0,
  },

  /* ─── Mini Vendors ─── */
  miniVendorScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  miniVendor: {
    width: 100,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  miniVendorEmojiBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniVendorEmoji: { fontSize: 22 },
  miniVendorName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
  },
  miniVendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniVendorRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },

  /* ─── Workers Mini ─── */
  workerScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  workerMini: {
    width: 136,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  workerMiniAvatar: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  workerMiniAvatarBusy: {
    borderColor: Colors.border,
    backgroundColor: Colors.divider,
  },
  workerMiniEmoji: { fontSize: 26 },
  workerMiniDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  wDotGreen: { backgroundColor: Colors.lightGreen },
  wDotRed: { backgroundColor: '#EF5350' },
  workerMiniName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 4,
  },
  workerMiniTrade: {
    fontSize: 10.5,
    color: Colors.primaryGreen,
    fontWeight: '600',
  },
  workerMiniRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  workerMiniRate: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  workerMiniRateLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  workerMiniHire: {
    marginTop: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 6,
    width: '100%',
    alignItems: 'center',
  },
  workerMiniHireText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ─── Bottom ─── */
  bottomSpacer: {
    height: 24,
  },
});
