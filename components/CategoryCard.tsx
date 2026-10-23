import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
// Local Category-ish prop type (was constants/MockData).
export type CategoryCardCategory = {
  name: string;
  icon: string;
  color: string;
};

type Props = {
  category: CategoryCardCategory;
  onPress?: () => void;
};

export default function CategoryCard({ category, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: category.color + '18' }]}>
        <MaterialIcons
          name={category.icon as any}
          size={28}
          color={category.color}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    width: 75,
    gap: 8,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceVariant,
  },
  name: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '600',
    textAlign: 'center',
  },
});
