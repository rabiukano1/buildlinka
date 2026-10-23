import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Colors } from '../constants/Colors';
import { errorMessage } from '../lib/backend';
import { useEngineer, type MemberStatus } from '../contexts/EngineerContext';
import { MEMBER_STATUS } from '../components/EngineerUI';

export default function TeamScreen() {
  const { team, projects, setMemberStatus } = useEngineer();
  const addMember = useMutation(api.projects.addMember);
  const removeMember = useMutation(api.projects.removeMember);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', projectId: '' });

  const save = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.phone.trim()) {
      Alert.alert('Missing details', 'Add a name, role and phone number.');
      return;
    }
    setSaving(true);
    try {
      await addMember({
        name: form.name.trim(),
        role: form.role.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        projectId: form.projectId ? form.projectId as Id<'projects'> : undefined,
      });
      setAdding(false);
      setForm({ name: '', role: '', phone: '', email: '', projectId: '' });
    } catch (err) {
      Alert.alert('Could not add crew member', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string, name: string) => {
    Alert.alert('Remove crew member', `Remove ${name} from your team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try { await removeMember({ memberId: id as Id<'projectMembers'> }); }
          catch (err) { Alert.alert('Could not remove', errorMessage(err)); }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'My Team' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Stat value={String(team.length)} label="Crew" />
          <Stat value={String(team.filter((m) => m.status === 'on-site').length)} label="On site" />
          <Stat value={String(team.filter((m) => m.projectId).length)} label="Assigned" />
        </View>

        {team.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="groups" size={48} color={Colors.outline} />
            <Text style={styles.emptyTitle}>No crew yet</Text>
            <Text style={styles.emptySub}>Add the workers and engineers you build with.</Text>
          </View>
        ) : team.map((m) => {
          const project = projects.find((p) => p.id === m.projectId);
          return (
            <View key={m.id} style={styles.card}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{m.avatar || m.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.flex}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.role}>{m.role}</Text>
                <Text style={styles.meta}>{project ? project.name : 'Unassigned'}</Text>
                <View style={styles.statusRow}>
                  {(Object.keys(MEMBER_STATUS) as MemberStatus[]).map((s) => (
                    <TouchableOpacity key={s} style={[styles.statusChip, m.status === s && styles.statusActive]} onPress={() => setMemberStatus(m.id, s)}>
                      <Text style={[styles.statusText, m.status === s && styles.statusTextActive]}>{MEMBER_STATUS[s].label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${m.phone}`).catch(() => {})} hitSlop={8}>
                  <MaterialIcons name="call" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(m.id, m.name)} hitSlop={8}>
                  <MaterialIcons name="person-remove" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setAdding(true)}>
          <MaterialIcons name="person-add" size={18} color={Colors.onPrimary} />
          <Text style={styles.primaryBtnText}>Add crew member</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Add crew member</Text>
              <TouchableOpacity onPress={() => setAdding(false)} hitSlop={8}><MaterialIcons name="close" size={22} color={Colors.outline} /></TouchableOpacity>
            </View>
            {(['name', 'role', 'phone', 'email'] as const).map((field) => (
              <TextInput
                key={field}
                style={styles.input}
                placeholder={{ name: 'Full name', role: 'Trade or role', phone: 'Phone number', email: 'Email (optional)' }[field]}
                placeholderTextColor={Colors.outline}
                keyboardType={field === 'phone' ? 'phone-pad' : field === 'email' ? 'email-address' : 'default'}
                autoCapitalize={field === 'email' ? 'none' : 'words'}
                value={form[field]}
                onChangeText={(t) => setForm({ ...form, [field]: t })}
              />
            ))}
            <Text style={styles.label}>Assign to project</Text>
            <View style={styles.projectChips}>
              <TouchableOpacity style={[styles.projectChip, !form.projectId && styles.projectChipActive]} onPress={() => setForm({ ...form, projectId: '' })}>
                <Text style={[styles.projectText, !form.projectId && styles.projectTextActive]}>None</Text>
              </TouchableOpacity>
              {projects.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.projectChip, form.projectId === p.id && styles.projectChipActive]} onPress={() => setForm({ ...form, projectId: p.id })}>
                  <Text style={[styles.projectText, form.projectId === p.id && styles.projectTextActive]} numberOfLines={1}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Add to team</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  flex: { flex: 1 },
  summary: { flexDirection: 'row', padding: 14, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  statLabel: { fontSize: 11, color: Colors.outline, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.outline, textAlign: 'center' },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  name: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  role: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginTop: 1 },
  meta: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: Colors.surfaceVariant },
  statusActive: { backgroundColor: Colors.primary },
  statusText: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant },
  statusTextActive: { color: Colors.onPrimary },
  actions: { justifyContent: 'space-between', paddingVertical: 4 },
  primaryBtn: { flexDirection: 'row', gap: 8, height: 48, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
  disabled: { opacity: 0.6 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 8 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  input: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, paddingHorizontal: 12, color: Colors.onSurface, fontSize: 14 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant, marginTop: 4 },
  projectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  projectChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, maxWidth: '48%' },
  projectChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  projectText: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant },
  projectTextActive: { color: Colors.onPrimary },
});
