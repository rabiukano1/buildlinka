import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useCart } from '../contexts/CartContext';
import { PRODUCTS } from '../constants/MockData';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

export default function CartView() {
  const router = useRouter();
  const { items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="shopping-cart" size={80} color={Colors.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Browse materials and add items to get started</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/materials')}>
          <MaterialIcons name="store" size={18} color="#fff" />
          <Text style={styles.shopBtnText}>Browse Materials</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemEmoji}>
              <Text style={styles.emoji}>{item.product.imageEmoji}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.itemVendor}>{item.product.vendor}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <MaterialIcons name="remove" size={16} color={Colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <MaterialIcons name="add" size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.product.id)}>
              <MaterialIcons name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items ({totalItems})</Text>
                <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Calculated at checkout</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout' as any)}>
                <MaterialIcons name="lock" size={16} color="#fff" />
                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push('/my-cart' as any)}
            >
              <MaterialIcons name="shopping-cart" size={16} color={Colors.primaryGreen} />
              <Text style={styles.reviewBtnText}>View Full Cart</Text>
              <MaterialIcons name="chevron-right" size={18} color={Colors.primaryGreen} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
              <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
              <Text style={styles.clearText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    lineHeight: 20,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 99,
    marginTop: 12,
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
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
  emoji: { fontSize: 32 },
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
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryGreen,
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    marginTop: 8,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textMedium,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 99,
    marginTop: 14,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryGreen,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
});
