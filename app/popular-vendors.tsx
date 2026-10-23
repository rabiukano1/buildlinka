import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Colors } from '../constants/Colors';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { goBackOrHome } from '../lib/backend';

type Store = {
  _id: string;
  name: string;
  location: string;
  description: string;
  verified: boolean;
  isOpen: boolean;
  productCount: number;
  categories: string[];
};

function VendorCard({ vendor, index }: { vendor: Store; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.vendorCard, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={styles.vendorTop}>
        <View style={styles.vendorEmojiWrap}>
          <MaterialIcons name="store" size={24} color={Colors.primary} />
        </View>
        <View style={styles.vendorInfo}>
          <View style={styles.vendorNameRow}>
            <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
            {vendor.verified && (
              <MaterialIcons name="verified" size={14} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.vendorCategory} numberOfLines={1}>
            {vendor.categories.length > 0 ? vendor.categories.slice(0, 3).join(' · ') : 'General store'}
          </Text>
          <View style={styles.vendorMeta}>
            <View style={styles.vendorRating}>
              <MaterialIcons name="inventory-2" size={12} color={Colors.primary} />
              <Text style={styles.vendorRatingText}>{vendor.productCount} product{vendor.productCount !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.vendorDot}>·</Text>
            <MaterialIcons name="location-on" size={11} color={Colors.textLight} />
            <Text style={styles.vendorLocation} numberOfLines={1}>{vendor.location}</Text>
          </View>
        </View>
      </View>
      {!!vendor.description && <Text style={styles.vendorDesc} numberOfLines={2}>{vendor.description}</Text>}
      {!vendor.isOpen && <Text style={styles.closedNote}>Currently closed — not taking orders right now.</Text>}
      <View style={styles.vendorActions}>
        <TouchableOpacity style={styles.vendorBtn}>
          <MaterialIcons name="store" size={16} color={Colors.primary} />
          <Text style={styles.vendorBtnText}>Visit Store</Text>
        </TouchableOpacity>
        {vendor.verified && (
          <View style={styles.verifiedPill}>
            <MaterialIcons name="verified" size={16} color={Colors.primary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function PopularVendorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const stores = useQuery(api.stores.list, { limit: 50 });

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of stores ?? []) for (const c of s.categories) set.add(c);
    return [...set].sort();
  }, [stores]);

  const filtered = (stores ?? []).filter((v) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.location.toLowerCase().includes(q);
    const matchesCat = filterCat === 'All' || v.categories.includes(filterCat);
    return matchesSearch && matchesCat;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primary, '#0a5215', Colors.primaryContainer]}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => goBackOrHome()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Popular Vendors</Text>
          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>{stores?.length ?? 0}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendors..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterStrip}
      >
        {['All', ...categories].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filterCat === cat && styles.filterChipActive]}
            onPress={() => setFilterCat(cat)}
          >
            <Text style={[styles.filterChipText, filterCat === cat && styles.filterChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAwareWrapper
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {stores === undefined ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.emptyText}>Loading vendors…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="store" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No vendors found</Text>
            <Text style={styles.emptySub}>
              {stores.length === 0 ? 'No vendor stores yet. Check back soon.' : 'Try a different search or category.'}
            </Text>
          </View>
        ) : (
          filtered.map((vendor, i) => (
            <VendorCard key={vendor._id} vendor={vendor} index={i} />
          ))
        )}
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingTop: 8,
  },

  /* ─── Header ─── */
  headerWrap: {
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ─── Search ─── */
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    padding: 0,
  },

  /* ─── Filters ─── */
  filterStrip: {
    maxHeight: 48,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  /* ─── Vendor Card ─── */
  vendorCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  vendorTop: {
    flexDirection: 'row',
    gap: 12,
  },
  vendorEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorInfo: {
    flex: 1,
    gap: 2,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  vendorCategory: {
    fontSize: 12,
    color: Colors.primaryGreen,
    fontWeight: '600',
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  vendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  vendorRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
  },
  vendorDot: {
    fontSize: 14,
    color: Colors.textLight,
  },
  vendorLocation: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
    flex: 1,
  },
  vendorDesc: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 17,
  },
  closedNote: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  vendorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  vendorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    borderRadius: 99,
    paddingVertical: 10,
  },
  vendorBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  /* ─── Loading / Empty ─── */
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
