import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import Dropdown from '../components/Dropdown';
import { Colors } from '../constants/Colors';
import { useEngineer, type ProjectStatus } from '../contexts/EngineerContext';
import { errorMessage } from '../lib/backend';
import { PROJECT_STATUS, Field, Pill, PrimaryButton, ProgressBar, Sheet, nairaShort, ui } from '../components/EngineerUI';

const FILTERS: ('all' | ProjectStatus)[] = ['all', 'on-track', 'at-risk', 'delayed', 'completed'];

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ new?: string }>();
  const { projects, team, addProject } = useEngineer();
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(params.new === '1');
  const [draft, setDraft] = useState({ name: '', client: '', location: '', budget: '', deadline: '' });

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => projects.filter((p) => (filter === 'all' || p.status === filter) && (!q || `${p.name} ${p.client} ${p.location}`.toLowerCase().includes(q))),
    [projects, filter, q]
  );

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const canCreate = draft.name.trim() && draft.client.trim() && Number(draft.budget) > 0;

  const create = async () => {
    if (!canCreate) return;
    try {
      const id = await addProject({
        name: draft.name.trim(),
        client: draft.client.trim(),
        location: draft.location.trim() || 'Not set',
        budget: Number(draft.budget),
        deadline: draft.deadline.trim() || 'TBD',
      });
      setCreating(false);
      setDraft({ name: '', client: '', location: '', budget: '', deadline: '' });
      router.push(`/project/${id}` as any);
    } catch (err) {
      Alert.alert('Could not create project', errorMessage(err));
    }
  };

  const footer = (
    <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
      <PrimaryButton label="New project" icon="add" onPress={() => setCreating(true)} style={{ marginTop: 12 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'My Projects', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <KeyboardAwareWrapper contentContainerStyle={styles.content} footer={footer}>
        <View style={styles.summary}>
          <View style={styles.flex}>
            <Text style={styles.summaryLabel}>Total budget</Text>
            <Text style={styles.summaryValue}>{nairaShort(totalBudget)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, { color: Colors.secondary }]}>{nairaShort(totalSpent)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.summaryLabel}>Projects</Text>
            <Text style={styles.summaryValue}>{projects.length}</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput style={styles.searchInput} placeholder="Search projects, clients, places" placeholderTextColor={Colors.outline} value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filters}>
          <Dropdown
            title="Project status"
            value={filter}
            onChange={(v) => setFilter(v as typeof filter)}
            options={FILTERS.map((f) => ({
              value: f,
              label: f === 'all' ? 'All projects' : PROJECT_STATUS[f].label,
              icon: f === 'all' ? 'apps' : PROJECT_STATUS[f].icon,
              count: f === 'all' ? projects.length : projects.filter((p) => p.status === f).length,
            }))}
          />
        </View>

        {filtered.map((p) => {
          const status = PROJECT_STATUS[p.status];
          const crew = team.filter((m) => m.projectId === p.id).length;
          return (
            <TouchableOpacity key={p.id} style={[ui.card, { borderLeftWidth: 4, borderLeftColor: status.color }]} onPress={() => router.push(`/project/${p.id}` as any)} activeOpacity={0.7}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Pill {...status} />
              </View>
              <Text style={styles.client}>{p.client}</Text>
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={14} color={Colors.outline} />
                <Text style={styles.meta}>{p.location}</Text>
                <MaterialIcons name="groups" size={14} color={Colors.outline} />
                <Text style={styles.meta}>{crew} crew</Text>
                <MaterialIcons name="event" size={14} color={Colors.outline} />
                <Text style={styles.meta}>{p.deadline}</Text>
              </View>
              <View style={styles.progressRow}>
                <View style={styles.flex}>
                  <ProgressBar value={p.progress} color={status.color} />
                </View>
                <Text style={[styles.pct, { color: status.color }]}>{p.progress}%</Text>
              </View>
              <Text style={styles.budget}>{nairaShort(p.spent)} of {nairaShort(p.budget)} spent</Text>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="business" size={36} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No projects here</Text>
            <Text style={styles.emptySub}>Try another filter or create a new project.</Text>
          </View>
        )}
      </KeyboardAwareWrapper>

      <Sheet visible={creating} title="New project" onClose={() => setCreating(false)}>
        <Field label="Project name" placeholder="e.g. Maitama Duplex" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} autoFocus />
        <Field label="Client" placeholder="e.g. Habitat Dev. Corp" value={draft.client} onChangeText={(client) => setDraft({ ...draft, client })} />
        <Field label="Location" placeholder="e.g. Maitama, Abuja" value={draft.location} onChangeText={(location) => setDraft({ ...draft, location })} />
        <Field
          label="Budget (₦)"
          placeholder="50,000,000"
          keyboardType="number-pad"
          value={Number(draft.budget) ? Number(draft.budget).toLocaleString('en-NG') : ''}
          onChangeText={(t) => setDraft({ ...draft, budget: t.replace(/\D/g, '') })}
        />
        <Field label="Deadline" placeholder="e.g. Jun 2027" value={draft.deadline} onChangeText={(deadline) => setDraft({ ...draft, deadline })} />
        <PrimaryButton label="Create project" onPress={create} disabled={!canCreate} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  flex: { flex: 1 },

  summary: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.tertiary },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.onSurface, marginTop: 4 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },
  filters: { flexDirection: 'row', paddingBottom: 16 },

  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  client: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: Colors.outline, marginRight: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  pct: { fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  budget: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 8 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline },

  footer: { paddingHorizontal: 16, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.divider },
});
