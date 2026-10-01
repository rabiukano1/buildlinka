import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Linking, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Colors } from '../constants/Colors';
import { useEngineer, type MemberStatus } from '../contexts/EngineerContext';
import { MEMBER_STATUS, Chip, Pill, Sheet, ui } from '../components/EngineerUI';

const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Not available', 'No app on this device can handle that.'));

function ContactButtons({ phone, email }: { phone: string; email: string }) {
  return (
    <View style={styles.contactRow}>
      <TouchableOpacity style={styles.contactBtn} onPress={() => open(`tel:${phone}`)} accessibilityLabel="Call">
        <MaterialIcons name="phone" size={18} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.contactBtn} onPress={() => open(`sms:${phone}`)} accessibilityLabel="Text">
        <MaterialIcons name="sms" size={18} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.contactBtn} onPress={() => open(`mailto:${email}`)} accessibilityLabel="Email">
        <MaterialIcons name="mail-outline" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const { team, projects, assignMember, setMemberStatus } = useEngineer();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | MemberStatus>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const projectName = (id: string | null) => (id ? projects.find((p) => p.id === id)?.name ?? 'Unknown' : 'Unassigned');
  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () => team.filter((m) => (filter === 'all' || m.status === filter) && (!q || `${m.name} ${m.role}`.toLowerCase().includes(q))),
    [team, filter, q]
  );

  const member = team.find((m) => m.id === openId);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'My Team', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <KeyboardAwareWrapper contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        <View style={styles.stats}>
          {[
            { label: 'Total', value: team.length, color: Colors.onSurface },
            { label: 'On site', value: team.filter((m) => m.status === 'on-site').length, color: Colors.secondary },
            { label: 'Idle', value: team.filter((m) => m.status === 'idle').length, color: Colors.outline },
            { label: 'Unassigned', value: team.filter((m) => !m.projectId).length, color: Colors.tertiary },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput style={styles.searchInput} placeholder="Search by name or role" placeholderTextColor={Colors.outline} value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'active', 'on-site', 'idle'] as const).map((f) => (
            <Chip key={f} label={f === 'all' ? 'All' : MEMBER_STATUS[f].label} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>

        {filtered.map((m) => (
          <TouchableOpacity key={m.id} style={[ui.card, styles.row]} onPress={() => setOpenId(m.id)} activeOpacity={0.7}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatar}>{m.avatar}</Text>
              <View style={[styles.dot, { backgroundColor: MEMBER_STATUS[m.status].color }]} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.role}>{m.role}</Text>
              <Text style={[styles.project, !m.projectId && { color: Colors.tertiary }]} numberOfLines={1}>{projectName(m.projectId)}</Text>
            </View>
            <ContactButtons phone={m.phone} email={m.email} />
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={36} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No team members found</Text>
          </View>
        )}
      </KeyboardAwareWrapper>

      <Sheet visible={!!member} title={member?.name ?? ''} onClose={() => setOpenId(null)}>
        {member && (
          <>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetAvatar}>{member.avatar}</Text>
              <View style={styles.flex}>
                <Text style={styles.role}>{member.role}</Text>
                <Pill {...MEMBER_STATUS[member.status]} />
              </View>
              <ContactButtons phone={member.phone} email={member.email} />
            </View>

            <Text style={ui.label}>Status</Text>
            <View style={ui.wrap}>
              {(Object.keys(MEMBER_STATUS) as MemberStatus[]).map((s) => (
                <Chip key={s} label={MEMBER_STATUS[s].label} active={member.status === s} onPress={() => setMemberStatus(member.id, s)} />
              ))}
            </View>

            <Text style={ui.label}>Assigned project</Text>
            <View style={ui.wrap}>
              <Chip label="Unassigned" active={!member.projectId} onPress={() => assignMember(member.id, null)} />
              {projects.filter((p) => p.status !== 'completed').map((p) => (
                <Chip key={p.id} label={p.name} active={member.projectId === p.id} onPress={() => assignMember(member.id, p.id)} />
              ))}
            </View>
          </>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  flex: { flex: 1 },

  stats: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 8, paddingVertical: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: Colors.outline, marginTop: 2 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },
  filters: { gap: 8, paddingBottom: 16 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceVariant + '66', alignItems: 'center', justifyContent: 'center' },
  avatar: { fontSize: 24 },
  dot: { position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.card },
  name: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  role: { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 1, marginBottom: 4 },
  project: { fontSize: 13, color: Colors.outline },

  contactRow: { flexDirection: 'row', gap: 6 },
  contactBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.greenTint + '99', alignItems: 'center', justifyContent: 'center' },

  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sheetAvatar: { fontSize: 36 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
});
