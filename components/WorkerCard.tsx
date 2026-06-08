import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import type { Worker } from '../constants/MockData';

type Props = {
  worker: Worker;
  onPress?: () => void;
};

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

export default function WorkerCard({ worker, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={[styles.avatar, !worker.available && styles.avatarBusy]}>
        <Text style={styles.avatarEmoji}>{worker.avatar}</Text>
        <View style={[styles.dot, worker.available ? styles.dotGreen : styles.dotRed]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{worker.name}</Text>
          {worker.completedJobs > 100 && (
            <View style={styles.topBadge}>
              <MaterialIcons name="verified" size={12} color={Colors.amber} />
              <Text style={styles.topBadgeText}>Top Pro</Text>
            </View>
          )}
        </View>
        <Text style={styles.trade}>{worker.trade}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="star" size={13} color={Colors.amber} />
            <Text style={styles.metaText}>{worker.rating} ({worker.reviewCount})</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{worker.location}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="work" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{worker.completedJobs} jobs</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialIcons name="history" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{worker.experience} yrs exp</Text>
          </View>
        </View>
      </View>

      {/* Right */}
      <View style={styles.right}>
        <Text style={styles.rate}>{formatPrice(worker.dailyRate)}</Text>
        <Text style={styles.rateLabel}>/day</Text>
        <TouchableOpacity
          style={[styles.hireBtn, !worker.available && styles.hireBtnDisabled]}
          disabled={!worker.available}
        >
          <Text style={styles.hireText}>{worker.available ? 'Hire' : 'Busy'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  avatarBusy: {
    borderColor: Colors.border,
    backgroundColor: Colors.divider,
  },
  avatarEmoji: { fontSize: 30 },
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  dotGreen: { backgroundColor: Colors.success },
  dotRed: { backgroundColor: Colors.error },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  topBadgeText: { fontSize: 9.5, fontWeight: '700', color: Colors.secondary },
  trade: { fontSize: 12.5, color: Colors.primaryGreen, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  metaText: { fontSize: 11.5, color: Colors.textMedium, flex: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  right: { alignItems: 'center', gap: 2 },
  rate: { fontSize: 15, fontWeight: '800', color: Colors.primaryGreen },
  rateLabel: { fontSize: 10, color: Colors.textLight },
  hireBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 99, // Pill shaped as per DESIGN.md
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  hireBtnDisabled: { backgroundColor: Colors.border },
  hireText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
