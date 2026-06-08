import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useCart } from '../contexts/CartContext';
import { useSaved } from '../contexts/SavedItemsContext';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

export default function SavedScreen() {
  const router = useRouter();
  const { items, toggleSave, clearSaved } = useSaved();
  const { addItem } = useCart();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: `Saved Items (${items.length})` }} />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="bookmark-border" size={80} color={Colors.border} />
          <Text style={styles.emptyTitle}>No saved items</Text>
          <Text style={styles.emptySub}>Bookmark products to find them later</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/materials')}>
            <MaterialIcons name="search" size={18} color="#fff" />
            <Text style={styles.browseBtnText}>Browse Materials</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.savedItem}
              activeOpacity={0.8}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              <View style={styles.itemEmoji}>
                <Text style={styles.emoji}>{item.imageEmoji}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemVendor}>{item.vendor}</Text>
                <View style={styles.itemRow}>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={12} color={Colors.amber} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cartBtn} onPress={() => addItem(item, 1)}>
                  <MaterialIcons name="shopping-cart" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => toggleSave(item)}>
                  <MaterialIcons name="close" size={16} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.clearBtn} onPress={clearSaved}>
              <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 99,
    marginTop: 12,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  savedItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryOrange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemEmoji: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: { fontSize: 28 },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  itemVendor: {
    fontSize: 11,
    color: Colors.textMedium,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  actions: {
    justifyContent: 'center',
    gap: 8,
    marginLeft: 8,
  },
  cartBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    padding: 8,
  },
  removeBtn: {
    borderRadius: 99,
    padding: 6,
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
});
