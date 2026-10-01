import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Colors } from '../constants/Colors';
import { useEngineer, type Spec, type SpecStatus } from '../contexts/EngineerContext';
import { SPEC_STATUS, Chip, Field, Pill, PrimaryButton, Sheet, timeAgo, ui } from '../components/EngineerUI';

const TYPES = ['Structural', 'Geotechnical', 'MEP', 'Materials', 'Architectural'];

// What each status can move to, and the button label for it.
const NEXT: Record<SpecStatus, { to: SpecStatus; label: string; icon: string }[]> = {
  draft: [{ to: 'review', label: 'Submit for review', icon: 'send' }],
  review: [{ to: 'approved', label: 'Approve', icon: 'check' }, { to: 'draft', label: 'Send back to draft', icon: 'undo' }],
  approved: [{ to: 'review', label: 'Reopen for review', icon: 'refresh' }],
};

export default function SpecificationsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ project?: string; status?: string; new?: string }>();
  const { specs, projects, addSpec, setSpecStatus } = useEngineer();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | SpecStatus>(params.status && params.status in SPEC_STATUS ? (params.status as SpecStatus) : 'all');
  const [projectFilter, setProjectFilter] = useState(params.project ?? 'all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(params.new === '1');
  const [draft, setDraft] = useState({ name: '', projectId: params.project ?? '', type: 'Structural', sheets: '' });

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unknown project';
  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () => specs.filter((s) =>
      (status === 'all' || s.status === status)
      && (projectFilter === 'all' || s.projectId === projectFilter)
      && (!q || `${s.name} ${s.type} ${projectName(s.projectId)}`.toLowerCase().includes(q))),
    [specs, status, projectFilter, q, projects]
  );

  const open: Spec | undefined = specs.find((s) => s.id === openId);
  const canAdd = draft.name.trim() && draft.projectId && Number(draft.sheets) > 0;

  const add = () => {
    if (!canAdd) return;
    addSpec({ name: draft.name.trim(), projectId: draft.projectId, type: draft.type, sheets: Number(draft.sheets) });
    setDraft({ name: '', projectId: params.project ?? '', type: 'Structural', sheets: '' });
    setAdding(false);
  };

  const footer = (
    <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
      <PrimaryButton label="Add specification" icon="note-add" onPress={() => setAdding(true)} style={{ marginTop: 12 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Specifications', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <KeyboardAwareWrapper contentContainerStyle={styles.content} footer={footer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput style={styles.searchInput} placeholder="Search specs, types, projects" placeholderTextColor={Colors.outline} value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'draft', 'review', 'approved'] as const).map((s) => (
            <Chip
              key={s}
              label={`${s === 'all' ? 'All' : SPEC_STATUS[s].label} ${s === 'all' ? specs.length : specs.filter((x) => x.status === s).length}`}
              active={status === s}
              onPress={() => setStatus(s)}
            />
          ))}
        </ScrollView>

        {projectFilter !== 'all' && (
          <TouchableOpacity style={styles.projectBanner} onPress={() => setProjectFilter('all')} activeOpacity={0.7}>
            <MaterialIcons name="business" size={18} color={Colors.primary} />
            <Text style={styles.projectBannerText} numberOfLines={1}>{projectName(projectFilter)}</Text>
            <MaterialIcons name="close" size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {filtered.map((s) => {
          const meta = SPEC_STATUS[s.status];
          return (
            <TouchableOpacity key={s.id} style={[ui.card, styles.row]} onPress={() => setOpenId(s.id)} activeOpacity={0.7}>
              <View style={styles.docIcon}>
                <MaterialIcons name="description" size={22} color={Colors.tertiary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{projectName(s.projectId)}</Text>
                <Text style={styles.meta}>{s.type} · {s.sheets} sheets · {timeAgo(s.updatedAt)}</Text>
              </View>
              <Pill {...meta} />
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="description" size={36} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No specifications</Text>
            <Text style={styles.emptySub}>Change the filters or add a new spec.</Text>
          </View>
        )}
      </KeyboardAwareWrapper>

      <Sheet visible={!!open} title={open?.name ?? ''} onClose={() => setOpenId(null)}>
        {open && (
          <>
            <Pill {...SPEC_STATUS[open.status]} />
            <View style={styles.detailGrid}>
              {[
                ['Project', projectName(open.projectId)],
                ['Type', open.type],
                ['Sheets', String(open.sheets)],
                ['Last updated', timeAgo(open.updatedAt)],
              ].map(([k, v]) => (
                <View key={k} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{k}</Text>
                  <Text style={styles.detailValue}>{v}</Text>
                </View>
              ))}
            </View>
            {NEXT[open.status].map((n, i) =>
              i === 0 ? (
                <PrimaryButton key={n.to} label={n.label} icon={n.icon} onPress={() => setSpecStatus(open.id, n.to)} />
              ) : (
                <TouchableOpacity key={n.to} style={styles.secondaryBtn} onPress={() => setSpecStatus(open.id, n.to)} activeOpacity={0.7}>
                  <MaterialIcons name={n.icon as any} size={18} color={Colors.onSurfaceVariant} />
                  <Text style={styles.secondaryText}>{n.label}</Text>
                </TouchableOpacity>
              )
            )}
          </>
        )}
      </Sheet>

      <Sheet visible={adding} title="New specification" onClose={() => setAdding(false)}>
        <Field label="Name" placeholder="e.g. Roof Truss Details" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} />
        <Text style={ui.label}>Project</Text>
        <View style={ui.wrap}>
          {projects.map((p) => <Chip key={p.id} label={p.name} active={draft.projectId === p.id} onPress={() => setDraft({ ...draft, projectId: p.id })} />)}
        </View>
        <Text style={ui.label}>Type</Text>
        <View style={ui.wrap}>
          {TYPES.map((t) => <Chip key={t} label={t} active={draft.type === t} onPress={() => setDraft({ ...draft, type: t })} />)}
        </View>
        <Field label="Number of sheets" placeholder="e.g. 8" keyboardType="number-pad" value={draft.sheets} onChangeText={(t) => setDraft({ ...draft, sheets: t.replace(/\D/g, '') })} />
        <PrimaryButton label="Save as draft" onPress={add} disabled={!canAdd} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  flex: { flex: 1 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },
  filters: { gap: 8, paddingBottom: 12 },
  projectBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: Colors.greenTint, marginBottom: 12, maxWidth: '100%' },
  projectBannerText: { fontSize: 14, fontWeight: '600', color: Colors.primary, flexShrink: 1 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.amberLight + '99', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  sub: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 1 },
  meta: { fontSize: 12, color: Colors.outline, marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 14, color: Colors.outline },

  detailGrid: { marginTop: 16, borderRadius: 8, backgroundColor: Colors.background, paddingHorizontal: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  detailKey: { fontSize: 14, color: Colors.outline },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, flexShrink: 1, textAlign: 'right', marginLeft: 16 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant, marginTop: 12 },
  secondaryText: { fontSize: 15, fontWeight: '600', color: Colors.onSurfaceVariant },

  footer: { paddingHorizontal: 16, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.divider },
});
