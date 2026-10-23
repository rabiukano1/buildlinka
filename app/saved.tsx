import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useCart } from '../contexts/CartContext';
import { useSaved } from '../contexts/SavedItemsContext';
import ProductCard from '../components/ProductCard';

export default function SavedScreen() {
  const router = useRouter();
  const { items, toggleSave, clearSaved, isSaved } = useSaved();
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
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              horizontal
              onPress={() => router.push(`/product/${item._id}`)}
              onAddToCart={() => addItem(item)}
              onToggleSave={() => toggleSave(item)}
              isSaved={isSaved(item._id)}
            />
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
