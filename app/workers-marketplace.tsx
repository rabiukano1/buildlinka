import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Colors } from '../constants/Colors';
import { formatPrice } from '../lib/backend';

const TRADES = ['All', 'Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Welder', 'Tiler', 'Roofer'];

export default function WorkersMarketplaceScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'workers' | 'jobs'>('workers');
  const [trade, setTrade] = useState('All');
  const [search, setSearch] = useState('');

  const workers = useQuery(api.workers.list, {
    search: search.trim() || undefined,
    trade: trade === 'All' ? undefined : trade,
  });
  const jobs = useQuery(api.jobs.list, { limit: 60 });
  const me = useQuery(api.users.me);

  const myWorker = useQuery(api.workers.mine, me ? {} : 'skip');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Hire Workers' }} />
      <View style={styles.tabs}>
        {(['workers', 'jobs'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'workers' ? 'Workers' : 'Open jobs'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'workers' ? (
        <>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search trade, name or location"
              placeholderTextColor={Colors.outline}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={Colors.outline} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TRADES.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, trade === t && styles.chipActive]} onPress={() => setTrade(t)}>
                <Text style={[styles.chipText, trade === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {!myWorker && (
              <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={() => router.push('/worker-dashboard' as any)}>
                <View style={styles.ctaIcon}><MaterialIcons name="handyman" size={22} color={Colors.onPrimary} /></View>
                <View style={styles.flex}>
                  <Text style={styles.ctaTitle}>Offer your skills</Text>
                  <Text style={styles.ctaSub}>Create a worker profile and start getting jobs.</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors.onPrimary} />
              </TouchableOpacity>
            )}

            {workers === undefined ? (
              <ActivityIndicator style={{ marginTop: 32 }} color={Colors.primary} />
            ) : workers.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="engineering" size={44} color={Colors.outline} />
                <Text style={styles.emptyTitle}>No workers match that search</Text>
                <Text style={styles.emptySub}>Try another trade or clear the filters.</Text>
              </View>
            ) : (
              workers.map((w) => (
                <TouchableOpacity key={w._id} style={styles.card} activeOpacity={0.8} onPress={() => router.push('/worker-dashboard' as any)}>
                  <View style={styles.avatar}>
                    {w.photoUrl ? <Image source={{ uri: w.photoUrl }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{w.name.charAt(0).toUpperCase()}</Text>}
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>{w.name}</Text>
                      {w.verified && <MaterialIcons name="verified" size={15} color={Colors.primary} />}
                    </View>
                    <Text style={styles.meta}>{w.trade} · {w.experienceYears} yrs exp</Text>
                    <View style={styles.ratingRow}>
                      <MaterialIcons name="star" size={14} color={Colors.amber} />
                      <Text style={styles.rating}>{w.rating.toFixed(1)} ({w.reviewCount})</Text>
                      <Text style={styles.dot}>·</Text>
                      <Text style={styles.meta}>{w.jobsDone} jobs</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="place" size={13} color={Colors.outline} />
                      <Text style={styles.location} numberOfLines={1}>{w.location}</Text>
                    </View>
                  </View>
                  <View style={styles.rateCol}>
                    <Text style={styles.rate}>{formatPrice(w.hourlyRate)}</Text>
                    <Text style={styles.rateUnit}>/hour</Text>
                    <View style={[styles.available, !w.available && styles.unavailable]}>
                      <Text style={[styles.availableText, !w.available && styles.unavailableText]}>{w.available ? 'Available' : 'Busy'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.postJob} activeOpacity={0.85} onPress={() => router.push('/create-work' as any)}>
            <MaterialIcons name="post-add" size={20} color={Colors.onPrimary} />
            <Text style={styles.postJobText}>Post a job</Text>
          </TouchableOpacity>
          {jobs === undefined ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={Colors.primary} />
          ) : jobs.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="work-off" size={44} color={Colors.outline} />
              <Text style={styles.emptyTitle}>No open jobs yet</Text>
              <Text style={styles.emptySub}>Post the first one and workers will apply.</Text>
            </View>
          ) : jobs.map((j) => (
            <View key={j._id} style={styles.jobCard}>
              <View style={styles.jobTop}>
                <Text style={styles.jobTitle} numberOfLines={2}>{j.title}</Text>
                <Text style={styles.jobBudget}>{formatPrice(j.budget)}</Text>
              </View>
              <Text style={styles.jobMeta}>{j.trade} · {j.location}</Text>
              <Text style={styles.jobDesc} numberOfLines={2}>{j.description}</Text>
              <View style={styles.jobFoot}>
                <Text style={styles.jobMeta}>{j.applicationCount} applicant{j.applicationCount === 1 ? '' : 's'}</Text>
                <Text style={styles.jobPoster}>by {j.posterName}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 8, padding: 4, borderRadius: 999, backgroundColor: Colors.surfaceVariant },
  tab: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: Colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, height: 48, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  searchInput: { flex: 1, fontSize: 15, color: Colors.onSurface, paddingVertical: 0 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary },
  content: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: Colors.primary, marginBottom: 12 },
  ctaIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: Colors.card, marginBottom: 10, borderWidth: 1, borderColor: Colors.outlineVariant },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 52, height: 52 },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.onSurface, flexShrink: 1 },
  meta: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  rating: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  dot: { fontSize: 12, color: Colors.outline },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  location: { fontSize: 12, color: Colors.outline, flex: 1 },
  rateCol: { alignItems: 'flex-end' },
  rate: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  rateUnit: { fontSize: 10, color: Colors.outline },
  available: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: Colors.greenTint },
  unavailable: { backgroundColor: Colors.surfaceVariant },
  availableText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  unavailableText: { color: Colors.outline },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.onSurface, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.outline, textAlign: 'center' },
  postJob: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 999, backgroundColor: Colors.primary, marginBottom: 16 },
  postJobText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
  jobCard: { padding: 16, borderRadius: 14, backgroundColor: Colors.card, marginBottom: 10, borderWidth: 1, borderColor: Colors.outlineVariant },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  jobTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  jobBudget: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  jobMeta: { fontSize: 12, color: Colors.outline, marginTop: 4 },
  jobDesc: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  jobFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  jobPoster: { fontSize: 12, color: Colors.outline },
});
