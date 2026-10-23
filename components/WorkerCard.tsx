import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { formatPrice } from '../lib/backend';

/** Worker profile as returned by convex/workers.ts `list` / `mine`. */
export type WorkerCardWorker = {
  name: string;
  trade: string;
  rating: number;
  reviewCount: number;
  location: string;
  jobsDone: number;
  experienceYears: number;
  hourlyRate: number;
  available: boolean;
  verified?: boolean;
  photoUrl?: string | null;
};

type Props = {
  worker: WorkerCardWorker;
  onPress?: () => void;
};

export default function WorkerCard({ worker, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatar, !worker.available && styles.avatarBusy]}>
        {worker.photoUrl ? (
          <Image source={{ uri: worker.photoUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{worker.name.charAt(0).toUpperCase()}</Text>
        )}
        <View style={[styles.dot, worker.available ? styles.dotGreen : styles.dotRed]} />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
          {worker.verified && <MaterialIcons name="verified" size={14} color={Colors.primaryGreen} />}
        </View>
        <Text style={styles.trade}>{worker.trade}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="star" size={13} color={Colors.amber} />
            <Text style={styles.metaText}>{worker.rating.toFixed(1)} ({worker.reviewCount})</Text>
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
            <Text style={styles.metaText}>{worker.jobsDone} jobs</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialIcons name="history" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{worker.experienceYears} yrs exp</Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.rate}>{formatPrice(worker.hourlyRate)}</Text>
        <Text style={styles.rateLabel}>/hour</Text>
        <View style={[styles.hireBtn, !worker.available && styles.hireBtnDisabled]}>
          <Text style={styles.hireText}>{worker.available ? 'Hire' : 'Busy'}</Text>
        </View>
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
    overflow: 'hidden',
  },
  avatarBusy: {
    borderColor: Colors.border,
    backgroundColor: Colors.divider,
  },
  avatarImg: { width: 60, height: 60 },
  avatarText: { fontSize: 24, fontWeight: '700', color: Colors.primaryGreen },
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
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark, flexShrink: 1 },
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
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  hireBtnDisabled: { backgroundColor: Colors.border },
  hireText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
