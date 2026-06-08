import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import type { Product } from '../constants/MockData';

type Props = {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  onToggleSave?: () => void;
  isSaved?: boolean;
  horizontal?: boolean;
};

const formatPrice = (price: number) =>
  '₦' + price.toLocaleString('en-NG');

export default function ProductCard({ product, onPress, onAddToCart, onToggleSave, isSaved, horizontal }: Props) {
  if (horizontal) {
    return (
      <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.hEmoji}>
          <Text style={styles.emojiLarge}>{product.imageEmoji}</Text>
        </View>
        <View style={styles.hInfo}>
          <View style={styles.hTop}>
            {product.badge && (
              <View style={[styles.badge, product.badge === 'Best Seller' && styles.badgeOrange]}>
                <Text style={styles.badgeText}>{product.badge}</Text>
              </View>
            )}
            <Text style={styles.hName} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.hVendor}>
              <MaterialIcons name="store" size={11} color={Colors.textMuted} /> {product.vendor}
            </Text>
          </View>
          <View style={styles.hBottom}>
            <View>
              <Text style={styles.hPrice}>{formatPrice(product.price)}</Text>
              <Text style={styles.hUnit}>per {product.unit}</Text>
            </View>
            <View style={styles.hRight}>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={12} color={Colors.amber} />
                <Text style={styles.ratingText}>{product.rating}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={onAddToCart} activeOpacity={0.7}>
                <MaterialIcons name="shopping-cart" size={14} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageBox}>
        <Text style={styles.emoji}>{product.imageEmoji}</Text>
        {!product.inStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        {product.badge && (
          <View style={[styles.badgeAbs, product.badge === 'Best Seller' && styles.badgeOrange]}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        )}
        {onToggleSave && (
          <TouchableOpacity style={styles.saveBtn} onPress={onToggleSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={18} color={isSaved ? Colors.primaryOrange : Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.vendor} numberOfLines={1}>
          <MaterialIcons name="store" size={11} color={Colors.textMuted} /> {product.vendor}
        </Text>
        <View style={styles.bottom}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>/{product.unit}</Text>
          </View>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={12} color={Colors.amber} />
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /* Vertical card */
  card: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
  },
  imageBox: {
    height: 110,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 48 },
  outOfStock: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#00000050',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badgeAbs: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primaryGreen,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginBottom: 3 },
  vendor: { fontSize: 11, color: Colors.textMedium, marginBottom: 8 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: '800', color: Colors.primaryGreen },
  unit: { fontSize: 10, color: Colors.textLight },

  /* Horizontal card */
  hCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  hEmoji: {
    width: 90,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLarge: { fontSize: 40 },
  hInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  hTop: { gap: 2 },
  hName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  hVendor: { fontSize: 11, color: Colors.textMedium, marginTop: 2 },
  hBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  hPrice: { fontSize: 17, fontWeight: '800', color: Colors.primaryGreen },
  hUnit: { fontSize: 10, color: Colors.textLight },
  hRight: { alignItems: 'flex-end', gap: 6 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  /* Shared */
  badge: {
    backgroundColor: Colors.primaryGreen,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  badgeOrange: { backgroundColor: Colors.secondary },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  saveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 99,
    padding: 4,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.textMedium },
});
