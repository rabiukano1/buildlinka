import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Colors } from '../constants/Colors';
import { errorMessage, formatPrice } from '../lib/backend';

type Job = {
  _id: string;
  title: string;
  description: string;
  trade: string;
  location: string;
  budget: number;
  budgetType: 'fixed' | 'daily';
  startDate: string | null;
  duration: string | null;
  posterName: string;
  applicationCount: number;
};

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useQuery(api.users.me);
  const worker = useQuery(api.workers.mine, me ? {} : 'skip');
  const recommended = useQuery(api.jobs.recommended, worker ? {} : 'skip');
  const applications = useQuery(api.jobs.myApplications, worker ? {} : 'skip');
  const upsert = useMutation(api.workers.upsert);
  const setAvailability = useMutation(api.workers.setAvailability);
  const apply = useMutation(api.jobs.apply);
  const withdraw = useMutation(api.jobs.withdraw);

  const [setupOpen, setSetupOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ trade: '', location: '', hourlyRate: '', experienceYears: '', bio: '', skills: '' });
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState('');

  const openEdit = () => {
    if (!worker) {
      setForm({ trade: '', location: me?.location ?? '', hourlyRate: '', experienceYears: '', bio: '', skills: '' });
      setSetupOpen(true);
      return;
    }
    setForm({
      trade: worker.trade,
      location: worker.location,
      hourlyRate: String(worker.hourlyRate),
      experienceYears: String(worker.experienceYears),
      bio: worker.bio,
      skills: worker.skills.join(', '),
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!form.trade.trim() || !form.location.trim() || !form.hourlyRate.trim()) {
      Alert.alert('Missing details', 'Add your trade, location and hourly rate.');
      return;
    }
    setSaving(true);
    try {
      await upsert({
        trade: form.trade.trim(),
        location: form.location.trim(),
        hourlyRate: Number(form.hourlyRate),
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio.trim() || undefined,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSetupOpen(false);
      setEditing(false);
      Alert.alert('Profile saved', 'Your worker profile is live in the marketplace.');
    } catch (err) {
      Alert.alert('Could not save profile', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async () => {
    if (!worker) return;
    try {
      await setAvailability({ available: !worker.available });
    } catch (err) {
      Alert.alert('Could not update availability', errorMessage(err));
    }
  };

  const submitApplication = async () => {
    if (!applyJob || message.trim().length < 5) {
      Alert.alert('Add a message', 'Tell the poster why you are a good fit (at least 5 characters).');
      return;
    }
    setSaving(true);
    try {
      await apply({
        jobId: applyJob._id as Id<'jobs'>,
        message: message.trim(),
        quote: quote.trim() ? Number(quote) : undefined,
      });
      setApplyJob(null);
      setMessage('');
      setQuote('');
      Alert.alert('Application sent', 'The poster can now see your profile and message.');
    } catch (err) {
      Alert.alert('Could not apply', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (me === undefined) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!me) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Worker Dashboard' }} />
        <Text style={styles.emptyTitle}>Sign in to find work</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/sign-in' as any)}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (worker === undefined) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Worker Dashboard' }} />
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!worker) {
    return (
      <ScrollView contentContainerStyle={[styles.setupPage, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Become a Worker' }} />
        <View style={styles.setupIcon}><MaterialIcons name="handyman" size={34} color={Colors.primary} /></View>
        <Text style={styles.setupTitle}>Set up your worker profile</Text>
        <Text style={styles.setupSub}>Tell builders what you do. You can update this any time.</Text>
        <ProfileForm form={form} setForm={setForm} />
        <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Create profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const active = (applications ?? []).filter((a) => a.status === 'pending' || a.status === 'accepted');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Worker Dashboard' }} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.bigAvatar}><Text style={styles.bigAvatarText}>{worker.name.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{worker.name}</Text>
                {worker.verified && <MaterialIcons name="verified" size={16} color={Colors.primary} />}
              </View>
              <Text style={styles.meta}>{worker.trade} · {worker.experienceYears} yrs exp</Text>
              <Text style={styles.meta}>{worker.location}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
              <MaterialIcons name="edit" size={17} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <Stat value={worker.rating.toFixed(1)} label="Rating" />
            <Stat value={String(worker.jobsDone)} label="Jobs" />
            <Stat value={String(worker.reviewCount)} label="Reviews" />
            <Stat value={formatPrice(worker.hourlyRate)} label="Per hour" />
          </View>
          <TouchableOpacity style={[styles.availability, worker.available ? styles.availableOn : styles.availableOff]} onPress={toggleAvailable} activeOpacity={0.8}>
            <View style={[styles.dot, { backgroundColor: worker.available ? Colors.primary : Colors.outline }]} />
            <Text style={[styles.availabilityText, { color: worker.available ? Colors.primary : Colors.outline }]}>
              {worker.available ? 'Available for work — tap to pause' : 'Not available — tap to go live'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recommended jobs</Text>
          <TouchableOpacity onPress={() => router.push('/workers-marketplace' as any)}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {recommended === undefined ? <ActivityIndicator color={Colors.primary} /> : recommended.length === 0 ? (
          <Text style={styles.muted}>No open {worker.trade} jobs right now. New matching jobs will appear here.</Text>
        ) : recommended.map((j) => (
          <View key={j._id} style={styles.jobCard}>
            <View style={styles.jobTop}>
              <Text style={styles.jobTitle} numberOfLines={2}>{j.title}</Text>
              <Text style={styles.jobBudget}>{formatPrice(j.budget)}</Text>
            </View>
            <Text style={styles.meta}>{j.location}{j.duration ? ` · ${j.duration}` : ''}</Text>
            <Text style={styles.jobDesc} numberOfLines={2}>{j.description}</Text>
            <View style={styles.jobFoot}>
              <Text style={styles.meta}>{j.posterName}</Text>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setApplyJob(j as Job)}>
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>My applications</Text>
        {applications === undefined ? <ActivityIndicator color={Colors.primary} /> : (applications ?? []).length === 0 ? (
          <Text style={styles.muted}>You haven't applied to any jobs yet.</Text>
        ) : (applications ?? []).map((a) => (
          <View key={a._id} style={styles.appCard}>
            <View style={styles.flex}>
              <Text style={styles.appTitle} numberOfLines={1}>{a.job?.title ?? 'Job removed'}</Text>
              <Text style={styles.meta}>{a.job ? `${a.job.trade} · ${a.job.location}` : 'No longer available'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.statusPill, statusStyle(a.status).bg]}>
                <Text style={[styles.statusText, statusStyle(a.status).fg]}>{a.status}</Text>
              </View>
              {a.status === 'pending' && (
                <TouchableOpacity onPress={async () => {
                  try { await withdraw({ applicationId: a._id as Id<'applications'> }); } catch (err) { Alert.alert('Could not withdraw', errorMessage(err)); }
                }}>
                  <Text style={styles.withdraw}>Withdraw</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!applyJob || editing} transparent animationType="slide" onRequestClose={() => { setApplyJob(null); setEditing(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{editing ? 'Edit worker profile' : 'Apply for job'}</Text>
              <TouchableOpacity onPress={() => { setApplyJob(null); setEditing(false); }} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            {editing ? (
              <>
                <ProfileForm form={form} setForm={setForm} />
                <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Save changes</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalJob}>{applyJob?.title}</Text>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  placeholder="Why should they hire you?"
                  placeholderTextColor={Colors.outline}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                />
                <Text style={styles.label}>Your quote (optional, naira)</Text>
                <TextInput style={styles.input} placeholder={String(applyJob?.budget ?? '')} placeholderTextColor={Colors.outline} keyboardType="number-pad" value={quote} onChangeText={setQuote} />
                <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={submitApplication} disabled={saving}>
                  {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Send application</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function statusStyle(status: string) {
  if (status === 'accepted') return { bg: { backgroundColor: Colors.greenTint }, fg: { color: Colors.primary } };
  if (status === 'rejected') return { bg: { backgroundColor: '#fde8e8' }, fg: { color: '#b91c1c' } };
  if (status === 'withdrawn') return { bg: { backgroundColor: Colors.surfaceVariant }, fg: { color: Colors.outline } };
  return { bg: { backgroundColor: Colors.amberLight }, fg: { color: '#92400e' } };
}

function ProfileForm({ form, setForm }: { form: { trade: string; location: string; hourlyRate: string; experienceYears: string; bio: string; skills: string }; setForm: (f: typeof form) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>Trade</Text>
      <TextInput style={styles.input} placeholder="e.g. Mason" placeholderTextColor={Colors.outline} value={form.trade} onChangeText={(t) => setForm({ ...form, trade: t })} />
      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} placeholder="e.g. Lekki, Lagos" placeholderTextColor={Colors.outline} value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} />
      <View style={styles.twoCol}>
        <View style={styles.flex}>
          <Text style={styles.label}>Hourly rate (₦)</Text>
          <TextInput style={styles.input} placeholder="5000" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={form.hourlyRate} onChangeText={(t) => setForm({ ...form, hourlyRate: t })} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>Years experience</Text>
          <TextInput style={styles.input} placeholder="3" placeholderTextColor={Colors.outline} keyboardType="number-pad" value={form.experienceYears} onChangeText={(t) => setForm({ ...form, experienceYears: t })} />
        </View>
      </View>
      <Text style={styles.label}>Skills (comma separated)</Text>
      <TextInput style={styles.input} placeholder="blockwork, plastering, tiling" placeholderTextColor={Colors.outline} value={form.skills} onChangeText={(t) => setForm({ ...form, skills: t })} />
      <Text style={styles.label}>About you</Text>
      <TextInput style={[styles.input, styles.multiline]} placeholder="Briefly describe your experience" placeholderTextColor={Colors.outline} value={form.bio} onChangeText={(t) => setForm({ ...form, bio: t })} multiline />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  flex: { flex: 1 },
  meta: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  muted: { fontSize: 13, color: Colors.outline, lineHeight: 19, marginVertical: 8 },
  link: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  profileCard: { padding: 16, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.divider },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.onSurface },
  statLabel: { fontSize: 10, color: Colors.outline, marginTop: 2 },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 10, borderRadius: 10 },
  availableOn: { backgroundColor: Colors.greenTint },
  availableOff: { backgroundColor: Colors.surfaceVariant },
  dot: { width: 8, height: 8, borderRadius: 4 },
  availabilityText: { fontSize: 12, fontWeight: '600' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.onSurface, marginBottom: 8 },
  jobCard: { padding: 14, borderRadius: 14, backgroundColor: Colors.card, marginBottom: 10, borderWidth: 1, borderColor: Colors.outlineVariant },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  jobTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  jobBudget: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  jobDesc: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 6, lineHeight: 18 },
  jobFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  applyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.primary },
  applyText: { fontSize: 12, fontWeight: '700', color: Colors.onPrimary },
  appCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: Colors.card, marginBottom: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  appTitle: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  withdraw: { fontSize: 11, fontWeight: '700', color: '#b91c1c' },
  setupPage: { padding: 20, backgroundColor: Colors.background },
  setupIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  setupTitle: { fontSize: 22, fontWeight: '800', color: Colors.onSurface, textAlign: 'center', marginTop: 12 },
  setupSub: { fontSize: 14, color: Colors.outline, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant, marginTop: 8 },
  input: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, paddingHorizontal: 12, color: Colors.onSurface, fontSize: 14 },
  multiline: { height: 86, paddingTop: 10, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 10 },
  primaryBtn: { height: 48, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
  disabled: { opacity: 0.6 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, maxHeight: '88%' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  modalJob: { fontSize: 14, fontWeight: '700', color: Colors.onSurfaceVariant, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
});
