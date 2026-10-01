import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useEngineer, type ProjectStatus } from '../../contexts/EngineerContext';
import {
  PROJECT_STATUS, SPEC_STATUS, MEMBER_STATUS, Chip, Field, Pill, PrimaryButton, ProgressBar, Sheet, ScheduleVisitSheet,
  naira, nairaShort, visitLabel, ui,
} from '../../components/EngineerUI';

const QUICK_EXPENSES = [100000, 500000, 1000000, 5000000];

export default function ProjectDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, specs, team, visits, updateProject, logExpense, assignMember, toggleVisit, removeVisit } = useEngineer();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expense, setExpense] = useState('');
  const [crewOpen, setCrewOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Project' }} />
        <MaterialIcons name="search-off" size={40} color={Colors.outline} />
        <Text style={styles.emptyTitle}>Project not found</Text>
      </View>
    );
  }

  const status = PROJECT_STATUS[project.status];
  const used = project.budget ? (project.spent / project.budget) * 100 : 0;
  const overspending = used > project.progress + 10;
  const crew = team.filter((m) => m.projectId === project.id);
  const projectSpecs = specs.filter((s) => s.projectId === project.id);
  const projectVisits = visits.filter((v) => v.projectId === project.id).sort((a, b) => a.date.localeCompare(b.date));

  const setProgress = (value: number) => {
    const progress = Math.min(100, Math.max(0, value));
    updateProject(project.id, { progress });
    if (progress === 100 && project.status !== 'completed') {
      Alert.alert('Mark as completed?', `${project.name} is at 100%.`, [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Complete', onPress: () => updateProject(project.id, { status: 'completed' }) },
      ]);
    }
  };

  const saveExpense = () => {
    const amount = Number(expense);
    if (!amount) return;
    logExpense(project.id, amount);
    setExpense('');
    setExpenseOpen(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: project.name, headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[ui.card, { borderLeftWidth: 4, borderLeftColor: status.color }]}>
          <Pill {...status} />
          <Text style={styles.title}>{project.name}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="apartment" size={15} color={Colors.outline} />
            <Text style={styles.meta}>{project.client}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="location-on" size={15} color={Colors.outline} />
            <Text style={styles.meta}>{project.location}</Text>
            <MaterialIcons name="event" size={15} color={Colors.outline} />
            <Text style={styles.meta}>Due {project.deadline}</Text>
          </View>
          <Text style={[ui.label, styles.gapTop]}>Status</Text>
          <View style={styles.wrap}>
            {(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => (
              <Chip key={s} label={PROJECT_STATUS[s].label} icon={PROJECT_STATUS[s].icon} active={project.status === s} onPress={() => updateProject(project.id, { status: s })} />
            ))}
          </View>
        </View>

        <View style={ui.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Progress</Text>
            <Text style={[styles.bigNumber, { color: status.color }]}>{project.progress}%</Text>
          </View>
          <ProgressBar value={project.progress} color={status.color} height={10} />
          <View style={styles.stepRow}>
            {[-10, -5, 5, 10].map((d) => (
              <TouchableOpacity key={d} style={styles.stepBtn} onPress={() => setProgress(project.progress + d)} activeOpacity={0.7}>
                <Text style={styles.stepText}>{d > 0 ? `+${d}` : d}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[ui.card, overspending && styles.warnCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Budget</Text>
            <TouchableOpacity style={styles.smallBtn} onPress={() => setExpenseOpen(true)} activeOpacity={0.7}>
              <MaterialIcons name="add" size={16} color={Colors.primary} />
              <Text style={styles.smallBtnText}>Log expense</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.budgetRow}>
            <View style={styles.flex}>
              <Text style={styles.budgetLabel}>Spent</Text>
              <Text style={[styles.budgetValue, { color: Colors.secondary }]}>{nairaShort(project.spent)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text style={[styles.budgetValue, project.spent > project.budget && { color: Colors.error }]}>{nairaShort(project.budget - project.spent)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budgetValue}>{nairaShort(project.budget)}</Text>
            </View>
          </View>
          <ProgressBar value={used} color={overspending ? Colors.error : Colors.secondary} />
          <Text style={[styles.hint, overspending && { color: Colors.error }]}>
            {overspending
              ? `${Math.round(used)}% of budget used but only ${project.progress}% done — check costs.`
              : `${Math.round(used)}% of budget used at ${project.progress}% progress.`}
          </Text>
        </View>

        <View style={ui.sectionRow}>
          <Text style={[ui.sectionTitle, styles.noMargin]}>Site visits</Text>
          <TouchableOpacity onPress={() => setScheduling(true)} hitSlop={8}>
            <Text style={ui.link}>+ Schedule</Text>
          </TouchableOpacity>
        </View>
        <View style={[ui.card, styles.list]}>
          {projectVisits.length === 0 && <Text style={styles.emptyText}>No visits scheduled.</Text>}
          {projectVisits.map((v, i) => (
            <View key={v.id} style={[styles.listRow, i > 0 && styles.divider]}>
              <TouchableOpacity onPress={() => toggleVisit(v.id)} hitSlop={8} accessibilityLabel={v.done ? 'Mark not done' : 'Mark done'}>
                <MaterialIcons name={v.done ? 'check-circle' : 'radio-button-unchecked'} size={24} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, v.done && styles.done]}>{v.purpose}</Text>
                <Text style={styles.rowSub}>{visitLabel(v.date)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeVisit(v.id)} hitSlop={8} accessibilityLabel="Remove visit">
                <MaterialIcons name="close" size={20} color={Colors.outline} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={ui.sectionRow}>
          <Text style={[ui.sectionTitle, styles.noMargin]}>Crew ({crew.length})</Text>
          <TouchableOpacity onPress={() => setCrewOpen(true)} hitSlop={8}>
            <Text style={ui.link}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={[ui.card, styles.list]}>
          {crew.length === 0 && <Text style={styles.emptyText}>No one assigned yet.</Text>}
          {crew.map((m, i) => (
            <View key={m.id} style={[styles.listRow, i > 0 && styles.divider]}>
              <Text style={styles.avatar}>{m.avatar}</Text>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{m.name}</Text>
                <Text style={styles.rowSub}>{m.role}</Text>
              </View>
              <Pill {...MEMBER_STATUS[m.status]} />
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${m.phone}`)} accessibilityLabel={`Call ${m.name}`}>
                <MaterialIcons name="phone" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={ui.sectionRow}>
          <Text style={[ui.sectionTitle, styles.noMargin]}>Specifications</Text>
          <TouchableOpacity onPress={() => router.push(`/specifications?project=${project.id}&new=1` as any)} hitSlop={8}>
            <Text style={ui.link}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={[ui.card, styles.list]}>
          {projectSpecs.length === 0 && <Text style={styles.emptyText}>No specs for this project.</Text>}
          {projectSpecs.map((s, i) => (
            <TouchableOpacity key={s.id} style={[styles.listRow, i > 0 && styles.divider]} onPress={() => router.push(`/specifications?project=${project.id}` as any)} activeOpacity={0.7}>
              <MaterialIcons name="description" size={22} color={Colors.tertiary} />
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{s.name}</Text>
                <Text style={styles.rowSub}>{s.type} · {s.sheets} sheets</Text>
              </View>
              <Pill {...SPEC_STATUS[s.status]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Sheet visible={expenseOpen} title="Log expense" onClose={() => setExpenseOpen(false)}>
        <Field
          label="Amount (₦)"
          placeholder="0"
          keyboardType="number-pad"
          value={Number(expense) ? Number(expense).toLocaleString('en-NG') : ''}
          onChangeText={(t) => setExpense(t.replace(/\D/g, ''))}
          autoFocus
          style={styles.amountInput}
        />
        <View style={styles.wrap}>
          {QUICK_EXPENSES.map((n) => (
            <Chip key={n} label={`+${nairaShort(n)}`} active={false} onPress={() => setExpense(String((Number(expense) || 0) + n))} />
          ))}
        </View>
        {Number(expense) > 0 && (
          <Text style={styles.hint}>New total spent: {naira(project.spent + Number(expense))}</Text>
        )}
        <PrimaryButton label="Add expense" onPress={saveExpense} disabled={!Number(expense)} />
      </Sheet>

      <Sheet visible={crewOpen} title="Assign crew" onClose={() => setCrewOpen(false)}>
        {team.map((m) => {
          const here = m.projectId === project.id;
          const elsewhere = projects.find((p) => p.id === m.projectId && p.id !== project.id);
          return (
            <TouchableOpacity key={m.id} style={[styles.assignRow, here && styles.assignRowActive]} onPress={() => assignMember(m.id, here ? null : project.id)} activeOpacity={0.7}>
              <Text style={styles.avatar}>{m.avatar}</Text>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{m.name}</Text>
                <Text style={styles.rowSub}>{m.role}{elsewhere ? ` · on ${elsewhere.name}` : ''}</Text>
              </View>
              <MaterialIcons name={here ? 'check-box' : 'check-box-outline-blank'} size={24} color={here ? Colors.primary : Colors.outlineVariant} />
            </TouchableOpacity>
          );
        })}
      </Sheet>

      <ScheduleVisitSheet visible={scheduling} onClose={() => setScheduling(false)} projectId={project.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  content: { padding: 16 },
  flex: { flex: 1 },
  noMargin: { marginBottom: 0 },
  gapTop: { marginTop: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },

  title: { fontSize: 22, fontWeight: '700', color: Colors.onSurface, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  meta: { fontSize: 14, color: Colors.onSurfaceVariant, marginRight: 10 },

  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  bigNumber: { fontSize: 24, fontWeight: '700' },
  stepRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stepBtn: { flex: 1, height: 40, borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  warnCard: { borderLeftWidth: 4, borderLeftColor: Colors.error },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: Colors.greenTint + '99' },
  smallBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  budgetRow: { flexDirection: 'row', marginBottom: 12 },
  budgetLabel: { fontSize: 12, color: Colors.outline },
  budgetValue: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
  hint: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 8 },
  amountInput: { height: 56, fontSize: 24, fontWeight: '700' },

  list: { paddingVertical: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.divider },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  rowSub: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  done: { textDecorationLine: 'line-through', color: Colors.outline },
  avatar: { fontSize: 26 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.greenTint + '99', alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.outline, paddingVertical: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },

  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.divider, marginBottom: 8 },
  assignRowActive: { borderColor: Colors.primary, backgroundColor: Colors.greenTint + '4d' },
});
