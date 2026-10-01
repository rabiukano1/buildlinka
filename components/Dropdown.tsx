import { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export type Option = { value: string; label: string; emoji?: string; icon?: string; count?: number };

export default function Dropdown({ value, options, onChange, title, placeholder }: {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  title: string;
  /** Shown (unhighlighted) when `value` matches no option, e.g. for a dropdown that navigates. */
  placeholder?: Omit<Option, 'value'>;
}) {
  const anchor = useRef<View>(null);
  const { height } = useWindowDimensions();
  const [menu, setMenu] = useState<{ x: number; y: number; w: number } | null>(null);
  const match = options.find((o) => o.value === value);
  const current = match ?? (placeholder ? { ...placeholder, value: '' } : options[0]);
  const isFiltered = !!match && value !== options[0].value && !placeholder;

  const open = () => anchor.current?.measureInWindow((x, y, w, h) => setMenu({ x, y: y + h + 6, w }));

  return (
    <View ref={anchor} collapsable={false} style={styles.dropdownAnchor}>
      <TouchableOpacity style={[styles.dropdownBtn, isFiltered && styles.dropdownBtnActive]} onPress={open} activeOpacity={0.7} accessibilityLabel={title}>
        {current.emoji ? <Text style={styles.optionEmoji}>{current.emoji}</Text> : current.icon ? <MaterialIcons name={current.icon as any} size={18} color={isFiltered ? Colors.onPrimary : Colors.onSurfaceVariant} /> : null}
        <Text style={[styles.dropdownText, isFiltered && styles.dropdownTextActive]} numberOfLines={1}>{current.label}</Text>
        <MaterialIcons name={menu ? 'expand-less' : 'expand-more'} size={20} color={isFiltered ? Colors.onPrimary : Colors.onSurfaceVariant} />
      </TouchableOpacity>

      <Modal visible={!!menu} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setMenu(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenu(null)} />
        {menu && (
          <View style={[styles.menu, { top: menu.y, left: menu.x, minWidth: Math.max(menu.w, 220), maxHeight: Math.min(360, height - menu.y - 24) }]}>
            <Text style={styles.menuTitle}>{title}</Text>
            <ScrollView bounces={false}>
              {options.map((o) => {
                const selected = o.value === value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    style={[styles.menuItem, selected && styles.menuItemActive]}
                    onPress={() => { onChange(o.value); setMenu(null); }}
                    activeOpacity={0.6}
                  >
                    {o.emoji ? <Text style={styles.optionEmoji}>{o.emoji}</Text> : <MaterialIcons name={o.icon as any} size={18} color={selected ? Colors.primary : Colors.onSurfaceVariant} />}
                    <Text style={[styles.menuItemText, selected && styles.menuItemTextActive]}>{o.label}</Text>
                    {o.count !== undefined && <Text style={styles.menuCount}>{o.count}</Text>}
                    <MaterialIcons name="check" size={18} color={selected ? Colors.primary : 'transparent'} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownAnchor: { flex: 1 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
  },
  dropdownBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dropdownText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  dropdownTextActive: { color: Colors.onPrimary },
  optionEmoji: { fontSize: 16 },

  menuBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.12)' },
  menu: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  menuTitle: { fontSize: 12, fontWeight: '600', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingVertical: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 16 },
  menuItemActive: { backgroundColor: Colors.greenTint + '66' },
  menuItemText: { flex: 1, fontSize: 16, color: Colors.onSurface },
  menuItemTextActive: { fontWeight: '600', color: Colors.primary },
  menuCount: { fontSize: 13, fontWeight: '600', color: Colors.outline },
});
