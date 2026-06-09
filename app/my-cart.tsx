import { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { PRODUCTS } from '../constants/MockData';
import { useCart } from '../contexts/CartContext';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

export default function MyCartScreen() {
  const router = useRouter();
  const { items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clearCart } = useCart();

  const recommended = useMemo(
    () => PRODUCTS.filter((p) => !items.some((i) => i.product.id === p.id)),
    [items]
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'My Cart',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={80} color={Colors.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse materials and add items to get started
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push('/(tabs)/materials' as any)}
          >
            <MaterialIcons name="store" size={18} color="#fff" />
            <Text style={styles.shopBtnText}>Browse Materials</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'My Cart',
          headerBackTitle: 'Back',
          headerTintColor: Colors.primary,
        }}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemThumb}>
              <Text style={styles.itemEmoji}>{item.product.imageEmoji}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.itemVendor}>{item.product.vendor}</Text>
              <Text style={styles.itemUnit}>Per {item.product.unit}</Text>
              <View style={styles.itemBottom}>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.product.price * item.quantity)}
                </Text>
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
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.unitPrice}>{formatPrice(item.product.price)}</Text>
              <Text style={styles.unitPriceLabel}>/ {item.product.unit}</Text>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeItem(item.product.id)}
              >
                <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items ({totalItems})</Text>
                <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Calculated at checkout</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout' as any)}>
                <MaterialIcons name="lock" size={16} color="#fff" />
                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>

            {/* ─── Recommended ─── */}
            {recommended.length > 0 && (
              <View style={styles.recommended}>
                <View style={styles.recommendedHeader}>
                  <MaterialIcons name="thumb-up" size={18} color={Colors.primaryGreen} />
                  <Text style={styles.recommendedTitle}>Recommended for your project</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendedScroll}
                  decelerationRate="fast"
                  snapToInterval={168}
                >
                  {recommended.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.recoCard}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    >
                      <View style={styles.recoEmoji}>
                        <Text style={styles.recoEmojiText}>{product.imageEmoji}</Text>
                      </View>
                      <Text style={styles.recoName} numberOfLines={2}>{product.name}</Text>
                      <Text style={styles.recoVendor} numberOfLines={1}>{product.vendor}</Text>
                      <View style={styles.recoBottom}>
                        <Text style={styles.recoPrice}>{formatPrice(product.price)}</Text>
                        <TouchableOpacity
                          style={styles.recoAddBtn}
                          onPress={() => addItem(product)}
                        >
                          <MaterialIcons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

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

  /* ─── Empty ─── */
  emptyContainer: {
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
  emptySubtitle: {
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

  /* ─── Cart Items ─── */
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
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
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
  itemUnit: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  unitPriceLabel: {
    fontSize: 9,
    color: Colors.textLight,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: Colors.error + '15',
    borderRadius: 99,
  },

  /* ─── Footer ─── */
  footer: {
    marginTop: 8,
    gap: 16,
  },

  /* ─── Order Summary ─── */
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 14,
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
  summaryDivider: {
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

  /* ─── Recommended ─── */
  recommended: {
    gap: 12,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  recommendedScroll: {
    gap: 10,
  },
  recoCard: {
    width: 158,
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recoEmoji: {
    height: 90,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoEmojiText: { fontSize: 36 },
  recoName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    paddingHorizontal: 8,
    paddingTop: 8,
    lineHeight: 16,
  },
  recoVendor: {
    fontSize: 10,
    color: Colors.textMedium,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  recoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  recoPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  recoAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ─── Clear ─── */
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
