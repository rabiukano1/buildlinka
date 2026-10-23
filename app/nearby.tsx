import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Colors } from '../constants/Colors';
import { formatPrice } from '../lib/backend';

type Tab = 'workers' | 'vendors';

export default function NearbyScreen() {
  const router = useRouter();
  const me = useQuery(api.users.me);
  const [tab, setTab] = useState<Tab>('workers');
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);

  const workers = useQuery(api.workers.list, {
    search: search.trim() || undefined,
    availableOnly: availableOnly || undefined,
    limit: 100,
  });
  const stores = useQuery(api.stores.list, { limit: 100 });

  const area = (me?.location ?? '').split(',')[0]?.trim().toLowerCase();

  const nearbyStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (stores ?? [])
      .filter((s) => !term || `${s.name} ${s.location} ${s.description} ${s.categories.join(' ')}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const aMatch = area && a.location.toLowerCase().includes(area) ? 1 : 0;
        const bMatch = area && b.location.toLowerCase().includes(area) ? 1 : 0;
        return bMatch - aMatch || Number(b.isOpen) - Number(a.isOpen) || b.rating - a.rating;
      });
  }, [stores, search, area]);

  const nearbyWorkers = useMemo(() => {
    return [...(workers ?? [])].sort((a, b) => {
      const aMatch = area && a.location.toLowerCase().includes(area) ? 1 : 0;
      const bMatch = area && b.location.toLowerCase().includes(area) ? 1 : 0;
      return bMatch - aMatch || Number(b.available) - Number(a.available) || b.rating - a.rating;
    });
  }, [workers, area]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Find Nearby', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />
      <View style={styles.top}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'workers' ? 'Search trade, name or area' : 'Search vendors or materials'}
            placeholderTextColor={Colors.outline}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}><MaterialIcons name="close" size={18} color={Colors.outline} /></TouchableOpacity>
          )}
        </View>
        {!!area && <Text style={styles.areaHint}><MaterialIcons name="near-me" size={12} color={Colors.primary} /> Same-area results first · {me?.location}</Text>}
        <View style={styles.tabs}>
          {(['workers', 'vendors'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'workers' ? 'Workers' : 'Vendors'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {tab === 'workers' && (
          <TouchableOpacity style={styles.availableToggle} onPress={() => setAvailableOnly(!availableOnly)}>
            <MaterialIcons name={availableOnly ? 'check-box' : 'check-box-outline-blank'} size={19} color={availableOnly ? Colors.primary : Colors.outline} />
            <Text style={styles.availableText}>Available now only</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'workers' ? (
          workers === undefined ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : nearbyWorkers.length === 0 ? (
            <Empty
              icon="handyman"
              title="No workers found"
              sub={search ? 'Try a different trade or area.' : 'Workers will appear here as they join BuildLinka.'}
              action="Browse marketplace"
              onPress={() => router.push('/workers-marketplace' as any)}
            />
          ) : nearbyWorkers.map((w) => (
            <TouchableOpacity key={w._id} style={styles.card} onPress={() => router.push('/workers-marketplace' as any)} activeOpacity={0.85}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{w.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{w.name}</Text>
                  {w.verified && <MaterialIcons name="verified" size={15} color={Colors.primary} />}
                  {w.available && <View style={styles.liveDot} />}
                </View>
                <Text style={styles.role}>{w.trade} · {w.experienceYears} yrs</Text>
                <Text style={styles.meta}><MaterialIcons name="place" size={11} color={Colors.outline} /> {w.location}</Text>
                {w.skills.length > 0 && <Text style={styles.skills} numberOfLines={1}>{w.skills.slice(0, 4).join(' · ')}</Text>}
              </View>
              <View style={styles.right}>
                <Text style={styles.rate}>{formatPrice(w.hourlyRate)}</Text>
                <Text style={styles.perHour}>/hr</Text>
                <Text style={styles.rating}>★ {w.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          stores === undefined ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : nearbyStores.length === 0 ? (
            <Empty icon="storefront" title="No vendors found" sub={search ? 'Try another search term.' : 'Vendors will appear here as they open stores.'} action="Browse marketplace" onPress={() => router.push('/(tabs)' as any)} />
          ) : nearbyStores.map((s) => (
            <TouchableOpacity key={s._id} style={styles.card} onPress={() => router.push('/(tabs)' as any)} activeOpacity={0.85}>
              <View style={[styles.avatar, { backgroundColor: Colors.amberLight }]}>
                <MaterialIcons name="storefront" size={22} color={Colors.tertiary} />
              </View>
              <View style={styles.flex}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{s.name}</Text>
                  {s.verified && <MaterialIcons name="verified" size={15} color={Colors.primary} />}
                </View>
                <Text style={styles.meta}><MaterialIcons name="place" size={11} color={Colors.outline} /> {s.location}</Text>
                <Text style={styles.skills} numberOfLines={1}>{s.productCount} products{s.categories.length ? ` · ${s.categories.slice(0, 2).join(', ')}` : ''}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.rating}>★ {s.rating.toFixed(1)}</Text>
                <Text style={styles.reviews}>{s.reviewCount} reviews</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Empty({ icon, title, sub, action, onPress }: { icon: string; title: string; sub: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><MaterialIcons name={icon as any} size={34} color={Colors.primary} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onPress}><Text style={styles.primaryBtnText}>{action}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  top: { paddingHorizontal: 16, paddingTop: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderRadius: 12, backgroundColor: Colors.surfaceVariant, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.onSurface, height: '100%' },
  areaHint: { fontSize: 11, color: Colors.primary, marginTop: 8, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { paddingHorizontal: 18, height: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: Colors.surfaceVariant },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.onPrimary },
  availableToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  availableText: { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 19, fontWeight: '700', color: Colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 2 },
  role: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  meta: { fontSize: 11, color: Colors.outline, marginTop: 3 },
  skills: { fontSize: 11, color: Colors.outline, marginTop: 3 },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  rate: { fontSize: 14, fontWeight: '800', color: Colors.onSurface },
  perHour: { fontSize: 9, color: Colors.outline },
  rating: { fontSize: 12, fontWeight: '700', color: Colors.amber, marginTop: 4 },
  reviews: { fontSize: 9, color: Colors.outline },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.outline, textAlign: 'center', lineHeight: 19 },
  primaryBtn: { height: 44, paddingHorizontal: 22, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.onPrimary },
});
