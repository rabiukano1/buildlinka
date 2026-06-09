import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const SPECS = [
  {
    id: 'sp1',
    name: 'Structural Steel Specs',
    project: 'Greenview Estate',
    type: 'Structural',
    sheets: 12,
    updated: '2 days ago',
    status: 'approved',
  },
  {
    id: 'sp2',
    name: 'Foundation Design',
    project: 'Ikeja Mall Complex',
    type: 'Geotechnical',
    sheets: 8,
    updated: '1 week ago',
    status: 'review',
  },
  {
    id: 'sp3',
    name: 'Reinforcement Schedule',
    project: 'Lekki Bridge Access Rd',
    type: 'Structural',
    sheets: 16,
    updated: '3 days ago',
    status: 'approved',
  },
  {
    id: 'sp4',
    name: 'MEP Specifications',
    project: 'Ikeja Mall Complex',
    type: 'MEP',
    sheets: 24,
    updated: '5 days ago',
    status: 'draft',
  },
  {
    id: 'sp5',
    name: 'Concrete Mix Design',
    project: 'Abuja Mall Renovation',
    type: 'Materials',
    sheets: 6,
    updated: '1 day ago',
    status: 'approved',
  },
  {
    id: 'sp6',
    name: 'Steel Connection Details',
    project: 'Greenview Estate',
    type: 'Structural',
    sheets: 10,
    updated: '2 weeks ago',
    status: 'review',
  },
];

const STATUS_META: Record<string, { label: string; icon: string; color: string }> = {
  approved: { label: 'Approved', icon: 'check-circle', color: Colors.success },
  review: { label: 'In Review', icon: 'hourglass-top', color: Colors.warning },
  draft: { label: 'Draft', icon: 'edit', color: Colors.textMuted },
};

export default function SpecificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<string | null>(null);

  const types = [...new Set(SPECS.map((s) => s.type))];
  const filtered = filter ? SPECS.filter((s) => s.type === filter) : SPECS;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.tertiary, '#524000', Colors.tertiaryContainer]}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Specifications</Text>
            <Text style={styles.headerSub}>{SPECS.length} documents</Text>
          </View>
          <MaterialIcons name="description" size={22} color="rgba(255,255,255,0.5)" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip, !filter && styles.filterChipActive]} onPress={() => setFilter(null)} activeOpacity={0.7}>
            <Text style={[styles.filterChipText, !filter && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {types.map((t) => (
            <TouchableOpacity key={t} style={[styles.filterChip, filter === t && styles.filterChipActive]} onPress={() => setFilter(t)} activeOpacity={0.7}>
              <Text style={[styles.filterChipText, filter === t && styles.filterChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((spec) => {
          const status = STATUS_META[spec.status];
          return (
            <TouchableOpacity key={spec.id} style={styles.specCard} activeOpacity={0.7} onPress={() => Alert.alert(spec.name, `Project: ${spec.project}\nType: ${spec.type}\nSheets: ${spec.sheets}\nUpdated: ${spec.updated}\nStatus: ${status.label}`)}>
              <View style={styles.specTop}>
                <View style={[styles.specIcon, { backgroundColor: Colors.tertiary + '18' }]}>
                  <MaterialIcons name="description" size={20} color={Colors.tertiary} />
                </View>
                <View style={styles.specInfo}>
                  <Text style={styles.specName}>{spec.name}</Text>
                  <Text style={styles.specProject}>{spec.project}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                  <MaterialIcons name={status.icon as any} size={11} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.specMeta}>
                <View style={styles.specMetaItem}>
                  <MaterialIcons name="article" size={12} color={Colors.textLight} />
                  <Text style={styles.specMetaText}>{spec.sheets} sheets</Text>
                </View>
                <View style={styles.specMetaDot} />
                <View style={styles.specMetaItem}>
                  <MaterialIcons name="schedule" size={12} color={Colors.textLight} />
                  <Text style={styles.specMetaText}>{spec.updated}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  content: { padding: 16, gap: 10 },

  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  filterChipActive: { backgroundColor: Colors.tertiary, borderColor: Colors.tertiary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textMedium },
  filterChipTextActive: { color: '#fff' },

  specCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 10, borderLeftWidth: 3, borderLeftColor: Colors.tertiary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  specTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  specIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  specInfo: { flex: 1 },
  specName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  specProject: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },

  specMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 52 },
  specMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specMetaText: { fontSize: 11, color: Colors.textLight },
  specMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.textMuted },
});
