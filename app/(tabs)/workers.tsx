import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../../constants/Colors';
import WorkerCard from '../../components/WorkerCard';

const TRADES = ['All', 'Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Welder', 'Tiler', 'Roofer'];

export default function WorkersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);

  const workers = useQuery(api.workers.list, {
    search: search.trim() || undefined,
    trade: trade === 'All' ? undefined : trade,
    availableOnly: availableOnly || undefined,
    limit: 100,
  });

  const results = useMemo(() => workers ?? [], [workers]);
  const availableCount = useMemo(() => results.filter((w) => w.available).length, [results]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a worker</Text>
        <Text style={styles.subtitle}>
          {workers === undefined
            ? 'Loading trusted trades…'
            : `${results.length} worker${results.length === 1 ? '' : 's'} · ${availableCount} available now`}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search trade, name or location"
          placeholderTextColor={Colors.outline}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TRADES.map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, trade === t && styles.chipActive]} onPress={() => setTrade(t)}>
            <Text style={[styles.chipText, trade === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.availableToggle} onPress={() => setAvailableOnly((v) => !v)} activeOpacity={0.7}>
          <MaterialIcons
            name={availableOnly ? 'check-box' : 'check-box-outline-blank'}
            size={19}
            color={availableOnly ? Colors.primary : Colors.outline}
          />
          <Text style={styles.availableText}>Available now only</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/workers-marketplace' as never)} hitSlop={8}>
          <Text style={styles.marketLink}>Jobs board</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {workers === undefined ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={Colors.primary} />
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="engineering" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{search || trade !== 'All' ? 'No workers match that search' : 'No workers yet'}</Text>
            <Text style={styles.emptySub}>
              {search || trade !== 'All'
                ? 'Try another trade or clear the filters.'
                : 'Be the first to offer your skills on BuildLinka.'}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/worker-dashboard' as never)} activeOpacity={0.8}>
              <MaterialIcons name="handyman" size={18} color={Colors.onPrimary} />
              <Text style={styles.primaryBtnText}>Create a worker profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          results.map((w) => (
            <WorkerCard
              key={w._id}
              worker={w}
              onPress={() => router.push('/workers-marketplace' as never)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.onSurface },
  subtitle: { fontSize: 12.5, color: Colors.outline, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, height: 48, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  searchInput: { flex: 1, fontSize: 15, color: Colors.onSurface, paddingVertical: 0 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 4 },
  availableToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availableText: { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '500' },
  marketLink: { fontSize: 12.5, fontWeight: '700', color: Colors.primary },
  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: Colors.onSurface, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.outline, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.primary },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
});
