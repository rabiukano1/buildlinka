import { useState, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type Review = {
  id: string;
  product: string;
  emoji: string;
  rating: number;
  text: string;
  date: string;
  vendor: string;
};

const MY_REVIEWS: Review[] = [
  { id: 'r1', product: 'Dangote Cement 42.5R (50kg)', emoji: '🏗️', rating: 5, text: 'Top quality cement, set perfectly. Will buy again.', date: '12 May 2026', vendor: 'Lagos Building Supplies' },
  { id: 'r2', product: 'Iron Rod 12mm (6m)', emoji: '⚙️', rating: 4, text: 'Good quality rods, straight and true to size.', date: '28 Apr 2026', vendor: 'Steel Masters Ltd' },
  { id: 'r3', product: 'Ceramic Floor Tiles 60×60cm', emoji: '🏛️', rating: 5, text: 'Beautiful tiles, great finish. Highly recommended!', date: '15 Apr 2026', vendor: 'TileWorld Nigeria' },
  { id: 'r4', product: 'Aluminum Roofing Sheet 0.5mm', emoji: '🏠', rating: 3, text: 'Decent quality but took longer to deliver.', date: '2 Apr 2026', vendor: 'RoofPro Nigeria' },
  { id: 'r5', product: 'PVC Water Pipe 3/4 inch (9m)', emoji: '🔧', rating: 4, text: 'Good pipes, sturdy and well priced.', date: '20 Mar 2026', vendor: 'PlumbShop PH' },
];

const FILTERS = [
  { key: 'all', label: 'All', icon: 'rate-review' },
  { key: '5', label: '5 ★', icon: 'star' },
  { key: '4', label: '4 ★', icon: 'star-half' },
  { key: '3', label: '3 ★', icon: 'star-border' },
] as const;

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialIcons key={s} name={s <= rating ? 'star' : 'star-border'} size={size} color={s <= rating ? Colors.amber : Colors.outlineVariant} />
      ))}
    </View>
  );
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return MY_REVIEWS;
    return MY_REVIEWS.filter((r) => r.rating === parseInt(activeFilter));
  }, [activeFilter]);

  const stats = useMemo(() => {
    const total = MY_REVIEWS.length;
    const avg = MY_REVIEWS.reduce((s, r) => s + r.rating, 0) / total;
    return { total, avg: avg.toFixed(1) };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'My Reviews' }} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.statsBar}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.avg}</Text>
                <StarRow rating={Math.round(parseFloat(stats.avg))} size={12} />
                <Text style={styles.statLbl}>Average Rating</Text>
              </View>
              <View style={styles.statVr} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.total}</Text>
                <MaterialIcons name="rate-review" size={18} color={Colors.primaryGreen} />
                <Text style={styles.statLbl}>Total Reviews</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
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
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardProduct} numberOfLines={1}>{item.product}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
              <StarRow rating={item.rating} />
              <Text style={styles.cardText}>{item.text}</Text>
              <Text style={styles.cardVendor}>{item.vendor}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="star-outline" size={44} color={Colors.border} />
            </View>
            <Text style={styles.emptyTitle}>No reviews found</Text>
            <Text style={styles.emptySub}>You haven't reviewed any products yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20, paddingBottom: 32 },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVr: {
    width: 1,
    height: 36,
    backgroundColor: Colors.outlineVariant,
  },

  filterContent: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 24 },
  cardBody: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardProduct: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  cardText: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 18,
  },
  cardVendor: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
