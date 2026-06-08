import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type Props = {
  placeholder?: string;
  onSearch?: (text: string) => void;
};

export default function SearchBar({ placeholder = 'Search materials, workers...', onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    setQuery(text);
    onSearch?.(text);
  };

  return (
    <View style={[styles.container, focused && styles.focused]}>
      <MaterialIcons name="search" size={22} color={focused ? Colors.primaryGreen : Colors.textLight} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={query}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => { setQuery(''); onSearch?.(''); }}>
          <MaterialIcons name="close" size={18} color={Colors.textLight} />
        </TouchableOpacity>
      )}
      {query.length === 0 && (
        <TouchableOpacity style={styles.filterBtn}>
          <MaterialIcons name="tune" size={20} color={Colors.primaryGreen} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    boxShadow: '0px 2px 6px 0px rgba(0,0,0,0.06)',
    elevation: 3,
  },
  focused: {
    borderColor: Colors.primaryGreen,
    boxShadow: '0px 2px 6px 0px rgba(0,0,0,0.12)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textDark,
    fontFamily: 'System',
  },
  filterBtn: {
    backgroundColor: Colors.greenTint,
    borderRadius: 8,
    padding: 4,
  },
});
