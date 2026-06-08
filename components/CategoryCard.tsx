import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import type { Category } from '../constants/MockData';

type Props = {
  category: Category;
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
    gap: 6,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  name: {
    fontSize: 11.5,
    color: Colors.textMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});
