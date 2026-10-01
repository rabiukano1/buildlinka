import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';
import { useEngineer, type Project } from '../contexts/EngineerContext';
import { PROJECT_STATUS, Pill, ProgressBar, ScheduleVisitSheet, nairaShort, visitLabel, ui, shadow } from '../components/EngineerUI';

const ENGINEER = {
  name: 'Eng. Ibrahim S.',
  title: 'Structural Engineer',
  avatar: '👨‍💼',
  location: 'Abuja, Nigeria',
  rating: 4.9,
  license: 'COREN R.12478',
};

// Spending running ahead of physical progress is the early warning sign of a budget overrun.
const budgetUsed = (p: Project) => (p.budget ? (p.spent / p.budget) * 100 : 0);
const isOverspending = (p: Project) => budgetUsed(p) > p.progress + 10;

function StatTile({ icon, value, label, color, onPress }: { icon: string; value: string; label: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.stat, { borderLeftColor: color }]} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <MaterialIcons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function EngineerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const { projects, specs, visits, toggleVisit } = useEngineer();
  const [scheduling, setScheduling] = useState(false);

  const active = projects.filter((p) => p.status !== 'completed');
  const totalBudget = active.reduce((s, p) => s + p.budget, 0);
  const totalSpent = active.reduce((s, p) => s + p.spent, 0);
  const pendingReviews = specs.filter((s) => s.status === 'review').length;
  const weekEnd = Date.now() + 7 * 86400000;
  const upcoming = visits
    .filter((v) => !v.done && new Date(v.date).getTime() < weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
  const attention = active.filter((p) => p.status === 'at-risk' || p.status === 'delayed' || isOverspending(p));
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Project';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Engineer',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/notifications' as any)} hitSlop={8} style={styles.bell}>
              <MaterialIcons name="notifications-none" size={24} color={Colors.onSurface} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[ui.card, styles.profile]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ENGINEER.avatar}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{ENGINEER.name}</Text>
            <Text style={styles.role}>{ENGINEER.title}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="location-on" size={14} color={Colors.outline} />
              <Text style={styles.meta}>{ENGINEER.location}</Text>
              <MaterialIcons name="star" size={14} color="#f5a623" />
              <Text style={styles.meta}>{ENGINEER.rating}</Text>
            </View>
          </View>
          <Pill label={ENGINEER.license} icon="verified" color={Colors.primary} bg={Colors.greenTint} />
        </View>

        <View style={styles.statGrid}>
          <StatTile icon="construction" value={String(active.length)} label="Active projects" color={Colors.primary} onPress={() => router.push('/projects' as any)} />
          <StatTile icon="account-balance-wallet" value={`${totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%`} label={`${nairaShort(totalSpent)} of ${nairaShort(totalBudget)}`} color={Colors.secondary} />
          <StatTile icon="rate-review" value={String(pendingReviews)} label="Specs to review" color={Colors.tertiary} onPress={() => router.push('/specifications?status=review' as any)} />
          <StatTile icon="event" value={String(upcoming.length)} label="Visits this week" color={Colors.primary} onPress={() => setScheduling(true)} />
        </View>

        {attention.length > 0 && (
          <>
            <Text style={[ui.sectionTitle, styles.sectionGap]}>Needs attention</Text>
            {attention.map((p) => {
              const status = PROJECT_STATUS[p.status];
              const reason = p.status === 'at-risk' ? 'Marked at risk' : p.status === 'delayed' ? `Delayed · due ${p.deadline}` : `Spent ${Math.round(budgetUsed(p))}% of budget at ${p.progress}% progress`;
              return (
                <TouchableOpacity key={p.id} style={[ui.card, styles.alert]} onPress={() => router.push(`/project/${p.id}` as any)} activeOpacity={0.7}>
                  <MaterialIcons name={isOverspending(p) && p.status === 'on-track' ? 'trending-up' : (status.icon as any)} size={22} color={Colors.error} />
                  <View style={styles.flex}>
                    <Text style={styles.alertTitle}>{p.name}</Text>
                    <Text style={styles.alertText}>{reason}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={Colors.outline} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={ui.sectionRow}>
          <Text style={[ui.sectionTitle, styles.noMargin]}>Upcoming site visits</Text>
          <TouchableOpacity onPress={() => setScheduling(true)} hitSlop={8}>
            <Text style={ui.link}>+ Schedule</Text>
          </TouchableOpacity>
        </View>
        <View style={[ui.card, styles.listCard]}>
          {upcoming.length === 0 ? (
            <Text style={styles.emptyText}>No visits this week. Tap “Schedule” to plan one.</Text>
          ) : (
            upcoming.slice(0, 4).map((v, i) => (
              <View key={v.id} style={[styles.visitRow, i > 0 && styles.divider]}>
                <TouchableOpacity onPress={() => toggleVisit(v.id)} hitSlop={8} accessibilityLabel="Mark visit done">
                  <MaterialIcons name="radio-button-unchecked" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.flex}>
                  <Text style={styles.visitTitle}>{v.purpose}</Text>
                  <Text style={styles.visitMeta}>{visitLabel(v.date)} · {projectName(v.projectId)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={ui.sectionRow}>
          <Text style={[ui.sectionTitle, styles.noMargin]}>Active projects</Text>
          <TouchableOpacity onPress={() => router.push('/projects' as any)} hitSlop={8}>
            <Text style={ui.link}>View all</Text>
          </TouchableOpacity>
        </View>
        {active.slice(0, 3).map((p) => {
          const status = PROJECT_STATUS[p.status];
          return (
            <TouchableOpacity key={p.id} style={[ui.card, { borderLeftWidth: 4, borderLeftColor: status.color }]} onPress={() => router.push(`/project/${p.id}` as any)} activeOpacity={0.7}>
              <View style={styles.projectTop}>
                <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                <Pill {...status} />
              </View>
              <Text style={styles.projectClient}>{p.client} · due {p.deadline}</Text>
              <View style={styles.progressRow}>
                <View style={styles.flex}>
                  <ProgressBar value={p.progress} color={status.color} />
                </View>
                <Text style={[styles.progressPct, { color: status.color }]}>{p.progress}%</Text>
              </View>
              <Text style={styles.budgetLine}>
                {nairaShort(p.spent)} spent of {nairaShort(p.budget)}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text style={[ui.sectionTitle, styles.sectionGap]}>Quick actions</Text>
        <View style={styles.actions}>
          {[
            { icon: 'add-business', label: 'New project', route: '/projects?new=1' },
            { icon: 'groups', label: 'Team', route: '/team' },
            { icon: 'description', label: 'Specs', route: '/specifications' },
            { icon: 'settings', label: 'Settings', route: '/settings' },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.action} onPress={() => router.push(a.route as any)} activeOpacity={0.7}>
              <View style={styles.actionIcon}>
                <MaterialIcons name={a.icon as any} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScheduleVisitSheet visible={scheduling} onClose={() => setScheduling(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  flex: { flex: 1 },
  noMargin: { marginBottom: 0 },
  sectionGap: { marginTop: 12 },

  bell: { padding: 4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.amberLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28 },
  name: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  role: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  meta: { fontSize: 13, color: Colors.outline, marginRight: 6 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  stat: { width: '47%', flexGrow: 1, backgroundColor: Colors.card, borderRadius: 8, borderLeftWidth: 4, padding: 16, gap: 4, ...shadow },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.onSurface, marginTop: 4 },
  statLabel: { fontSize: 13, color: Colors.outline },

  alert: { flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: Colors.error },
  alertTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  alertText: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },

  listCard: { paddingVertical: 4 },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.divider },
  visitTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  visitMeta: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  emptyText: { fontSize: 14, color: Colors.outline, paddingVertical: 12 },

  projectTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectName: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  projectClient: { fontSize: 13, color: Colors.outline, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  progressPct: { fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  budgetLine: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 8 },

  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 8, backgroundColor: Colors.card, ...shadow },
  actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.greenTint + '99', alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontWeight: '600', color: Colors.onSurface, textAlign: 'center' },
});
