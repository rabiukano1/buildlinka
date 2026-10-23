import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Colors } from '../constants/Colors';
import { errorMessage, formatPrice } from '../lib/backend';

const TRADES = ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Welder', 'Tiler', 'Roofer', 'Labourer'];

export default function CreateWorkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useQuery(api.users.me);
  const posts = useQuery(api.jobs.minePosted, me ? {} : 'skip');
  const createJob = useMutation(api.jobs.create);

  const [tab, setTab] = useState<'post' | 'mine'>('post');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', trade: 'Mason', location: '', budget: '', workersNeeded: '1', startDate: '', duration: '',
  });

  const submit = async () => {
    if (!form.title.trim() || form.description.trim().length < 10 || !form.location.trim() || !Number(form.budget)) {
      Alert.alert('Missing details', 'Add a title, description (10+ characters), location and budget.');
      return;
    }
    setSaving(true);
    try {
      await createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        trade: form.trade,
        location: form.location.trim(),
        budget: Number(form.budget),
        workersNeeded: Number(form.workersNeeded) || 1,
        startDate: form.startDate.trim() || undefined,
        duration: form.duration.trim() || undefined,
      });
      setForm({ title: '', description: '', trade: 'Mason', location: '', budget: '', workersNeeded: '1', startDate: '', duration: '' });
      setTab('mine');
      Alert.alert('Job posted', 'Matching workers have been notified.');
    } catch (err) {
      Alert.alert('Could not post job', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (me === undefined) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator color={Colors.primary} /></View>;
  }
  if (!me) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerTitle: 'Post Work' }} />
        <Text style={styles.emptyTitle}>Sign in to post a job</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/sign-in' as any)}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Work' }} />
      <View style={styles.tabs}>
        {(['post', 'mine'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'post' ? 'Post a job' : `My jobs${posts?.length ? ` (${posts.length})` : ''}`}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'post' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Job title</Text>
          <TextInput style={styles.input} placeholder="e.g. Blockwork for 3-bed bungalow" placeholderTextColor={Colors.outline} value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="What needs to be done, materials available, site rules…" placeholderTextColor={Colors.outline} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline />

          <Text style={styles.label}>Trade</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TRADES.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, form.trade === t && styles.chipActive]} onPress={() => setForm({ ...form, trade: t })}>
                <Text style={[styles.chipText, form.trade === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} placeholder="e.g. Ajah, Lagos" placeholderTextColor={Colors.outline} value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} />

          <View style={styles.twoCol}>
            <View style={styles.flex}>
              <Text style={styles.label}>Budget (₦)</Text>
              <TextInput style={styles.input} placeholder="150000" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={form.budget} onChangeText={(t) => setForm({ ...form, budget: t })} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Workers needed</Text>
              <TextInput style={styles.input} placeholder="1" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={form.workersNeeded} onChangeText={(t) => setForm({ ...form, workersNeeded: t })} />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.flex}>
              <Text style={styles.label}>Start date</Text>
              <TextInput style={styles.input} placeholder="Next Monday" placeholderTextColor={Colors.outline} value={form.startDate} onChangeText={(t) => setForm({ ...form, startDate: t })} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Duration</Text>
              <TextInput style={styles.input} placeholder="2 weeks" placeholderTextColor={Colors.outline} value={form.duration} onChangeText={(t) => setForm({ ...form, duration: t })} />
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <><MaterialIcons name="send" size={18} color={Colors.onPrimary} /><Text style={styles.primaryBtnText}>Post job</Text></>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
          {posts === undefined ? <ActivityIndicator color={Colors.primary} /> : posts.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="work-off" size={44} color={Colors.outline} />
              <Text style={styles.emptyTitle}>No jobs posted yet</Text>
              <Text style={styles.emptySub}>Post a job and applications will show up here.</Text>
            </View>
          ) : posts.map((j) => (
            <PostedJob key={j._id} job={j} onBrowse={() => router.push('/workers-marketplace' as any)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

type Post = {
  _id: string;
  title: string;
  trade: string;
  location: string;
  budget: number;
  budgetType: 'fixed' | 'daily';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  applicationCount: number;
  createdAt: number;
};

function PostedJob({ job, onBrowse }: { job: Post; onBrowse: () => void }) {
  const [open, setOpen] = useState(false);
  const apps = useQuery(api.jobs.applicationsForJob, open ? { jobId: job._id as Id<'jobs'> } : 'skip');
  const respond = useMutation(api.jobs.respond);
  const complete = useMutation(api.jobs.complete);
  const cancel = useMutation(api.jobs.cancel);

  const act = async (fn: () => Promise<unknown>, fail: string) => {
    try { await fn(); } catch (err) { Alert.alert(fail, errorMessage(err)); }
  };

  return (
    <View style={styles.postCard}>
      <TouchableOpacity style={styles.postTop} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={styles.flex}>
          <Text style={styles.postTitle}>{job.title}</Text>
          <Text style={styles.meta}>{job.trade} · {job.location} · {formatPrice(job.budget)}</Text>
        </View>
        <View style={[styles.statusPill, statusColor(job.status).bg]}>
          <Text style={[styles.statusText, statusColor(job.status).fg]}>{job.status.replace('_', ' ')}</Text>
        </View>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={Colors.outline} />
      </TouchableOpacity>

      <Text style={styles.appCount}>{job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'}</Text>

      {open && (
        <View style={styles.apps}>
          {apps === undefined ? <ActivityIndicator color={Colors.primary} /> : apps.length === 0 ? (
            <TouchableOpacity onPress={onBrowse}><Text style={styles.emptyApps}>No applicants yet. Browse workers to invite someone.</Text></TouchableOpacity>
          ) : apps.map((a) => (
            <View key={a._id} style={styles.appCard}>
              <View style={styles.appHead}>
                <Text style={styles.appName}>{a.worker?.name ?? a.applicantName}</Text>
                <Text style={styles.appRating}>★ {a.worker?.rating?.toFixed(1) ?? '—'} ({a.worker?.reviewCount ?? 0})</Text>
              </View>
              <Text style={styles.appMeta}>{a.worker?.trade} · {a.worker?.location} · {a.worker?.jobsDone ?? 0} jobs</Text>
              <Text style={styles.appMsg}>{a.message}</Text>
              {a.quote ? <Text style={styles.appQuote}>Quote: {formatPrice(a.quote)}</Text> : null}
              {a.status === 'pending' ? (
                <View style={styles.appActions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => act(() => respond({ applicationId: a._id as Id<'applications'>, accept: true }), 'Could not accept')}>
                    <Text style={styles.acceptText}>Hire</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => act(() => respond({ applicationId: a._id as Id<'applications'>, accept: false }), 'Could not decline')}>
                    <Text style={styles.rejectText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : <Text style={styles.appStatus}>{a.status}</Text>}
            </View>
          ))}
          <View style={styles.postActions}>
            {job.status === 'in_progress' && (
              <TouchableOpacity style={styles.completeBtn} onPress={() => act(() => complete({ id: job._id as Id<'jobs'> }), 'Could not complete')}>
                <Text style={styles.completeText}>Mark complete</Text>
              </TouchableOpacity>
            )}
            {(job.status === 'open' || job.status === 'in_progress') && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => Alert.alert('Cancel job?', 'This cannot be undone.', [
                { text: 'Keep job', style: 'cancel' },
                { text: 'Cancel job', style: 'destructive', onPress: () => act(() => cancel({ id: job._id as Id<'jobs'> }), 'Could not cancel') },
              ])}>
                <Text style={styles.cancelText}>Cancel job</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function statusColor(status: string) {
  if (status === 'completed') return { bg: { backgroundColor: Colors.greenTint }, fg: { color: Colors.primary } };
  if (status === 'cancelled') return { bg: { backgroundColor: '#fde8e8' }, fg: { color: '#b91c1c' } };
  if (status === 'in_progress') return { bg: { backgroundColor: Colors.amberLight }, fg: { color: '#92400e' } };
  return { bg: { backgroundColor: Colors.surfaceVariant }, fg: { color: Colors.onSurfaceVariant } };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 4, padding: 4, borderRadius: 999, backgroundColor: Colors.surfaceVariant },
  tab: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: Colors.card, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.primary },
  label: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant, marginTop: 12, marginBottom: 4 },
  input: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, paddingHorizontal: 12, color: Colors.onSurface, fontSize: 14 },
  multiline: { height: 100, paddingTop: 10, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 10 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary },
  primaryBtn: { flexDirection: 'row', gap: 8, height: 48, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
  disabled: { opacity: 0.6 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.outline, textAlign: 'center' },
  meta: { fontSize: 12, color: Colors.outline, marginTop: 3 },
  postCard: { borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 10, padding: 14 },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  appCount: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 8 },
  apps: { marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 },
  emptyApps: { fontSize: 13, color: Colors.outline, paddingVertical: 8 },
  appCard: { padding: 10, borderRadius: 10, backgroundColor: Colors.surfaceVariant + '80', marginBottom: 8 },
  appHead: { flexDirection: 'row', justifyContent: 'space-between' },
  appName: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  appRating: { fontSize: 12, color: Colors.amber, fontWeight: '700' },
  appMeta: { fontSize: 11, color: Colors.outline, marginTop: 2 },
  appMsg: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  appQuote: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  appActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  acceptBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.primary },
  acceptText: { fontSize: 12, fontWeight: '700', color: Colors.onPrimary },
  rejectBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
  rejectText: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant },
  appStatus: { fontSize: 11, fontWeight: '700', color: Colors.outline, marginTop: 6, textTransform: 'capitalize' },
  postActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  completeBtn: { flex: 1, height: 40, borderRadius: 999, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  completeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  cancelBtn: { flex: 1, height: 40, borderRadius: 999, backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },
});
