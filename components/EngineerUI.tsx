import { useState, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, ScrollView, TextInput, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useEngineer, type ProjectStatus, type SpecStatus, type MemberStatus } from '../contexts/EngineerContext';

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; icon: string; color: string; bg: string }> = {
  'on-track': { label: 'On track', icon: 'check-circle', color: Colors.primary, bg: Colors.greenTint },
  'at-risk': { label: 'At risk', icon: 'warning', color: Colors.error, bg: '#ffdad6' },
  delayed: { label: 'Delayed', icon: 'schedule', color: Colors.tertiary, bg: Colors.amberLight },
  completed: { label: 'Completed', icon: 'verified', color: Colors.onSurfaceVariant, bg: Colors.surfaceVariant },
};

export const SPEC_STATUS: Record<SpecStatus, { label: string; icon: string; color: string; bg: string }> = {
  draft: { label: 'Draft', icon: 'edit', color: Colors.onSurfaceVariant, bg: Colors.surfaceVariant },
  review: { label: 'In review', icon: 'hourglass-top', color: Colors.tertiary, bg: Colors.amberLight },
  approved: { label: 'Approved', icon: 'check-circle', color: Colors.primary, bg: Colors.greenTint },
};

export const MEMBER_STATUS: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: Colors.primary, bg: Colors.greenTint },
  'on-site': { label: 'On site', color: Colors.secondary, bg: Colors.orangeTint },
  idle: { label: 'Idle', color: Colors.onSurfaceVariant, bg: Colors.surfaceVariant },
};

export const naira = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
export const nairaShort = (n: number) =>
  n >= 1e9 ? `₦${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `₦${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `₦${Math.round(n / 1e3)}K` : naira(n);

export const timeAgo = (ts: number) => {
  const days = Math.floor((Date.now() - ts) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 7 ? `${days} days ago` : `${Math.floor(days / 7)} wk ago`;
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
export const visitLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const day = sameDay(d, today) ? 'Today' : sameDay(d, tomorrow) ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
};

export function Pill({ label, color, bg, icon }: { label: string; color: string; bg: string; icon?: string }) {
  return (
    <View style={[ui.pill, { backgroundColor: bg }]}>
      {icon ? <MaterialIcons name={icon as any} size={13} color={color} /> : <View style={[ui.pillDot, { backgroundColor: color }]} />}
      <Text style={[ui.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: string }) {
  return (
    <TouchableOpacity style={[ui.chip, active && ui.chipActive]} onPress={onPress} activeOpacity={0.7}>
      {icon && <MaterialIcons name={icon as any} size={16} color={active ? Colors.onPrimary : Colors.onSurfaceVariant} />}
      <Text style={[ui.chipText, active && ui.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ProgressBar({ value, color = Colors.primary, height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={[ui.track, { height, borderRadius: height / 2 }]}>
      <View style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={ui.field}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.outline}
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[ui.input, focused && ui.inputFocused, style]}
      />
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, icon, style }: { label: string; onPress: () => void; disabled?: boolean; icon?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <TouchableOpacity style={[ui.cta, disabled && ui.ctaDisabled, style]} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      {icon && <MaterialIcons name={icon as any} size={20} color={Colors.onSecondary} />}
      <Text style={ui.ctaText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={ui.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[ui.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <View style={ui.handle} />
          <View style={ui.sheetHeader}>
            <Text style={ui.sheetTitle}>{title}</Text>
            <TouchableOpacity style={ui.iconBtn} onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const HOURS = [8, 10, 12, 14, 16];

export function ScheduleVisitSheet({ visible, onClose, projectId }: { visible: boolean; onClose: () => void; projectId?: string }) {
  const { projects, addVisit } = useEngineer();
  const [pickedProject, setPickedProject] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [hour, setHour] = useState(10);
  const [purpose, setPurpose] = useState('');
  const target = projectId ?? pickedProject;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return { offset: i, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) };
  });

  const close = () => {
    setPickedProject(null);
    setDayOffset(0);
    setHour(10);
    setPurpose('');
    onClose();
  };

  const save = () => {
    if (!target || !purpose.trim()) return;
    const d = new Date(Date.now() + dayOffset * 86400000);
    d.setHours(hour, 0, 0, 0);
    addVisit({ projectId: target, purpose: purpose.trim(), date: d.toISOString() });
    close();
  };

  return (
    <Sheet visible={visible} title="Schedule site visit" onClose={close}>
      {!projectId && (
        <>
          <Text style={ui.label}>Project</Text>
          <View style={ui.wrap}>
            {projects.filter((p) => p.status !== 'completed').map((p) => (
              <Chip key={p.id} label={p.name} active={pickedProject === p.id} onPress={() => setPickedProject(p.id)} />
            ))}
          </View>
        </>
      )}
      <Field label="Purpose" placeholder="e.g. Slab inspection, progress check" value={purpose} onChangeText={setPurpose} />
      <Text style={ui.label}>Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ui.row}>
        {days.map((d) => <Chip key={d.offset} label={d.label} active={dayOffset === d.offset} onPress={() => setDayOffset(d.offset)} />)}
      </ScrollView>
      <Text style={[ui.label, ui.gap]}>Time</Text>
      <View style={ui.wrap}>
        {HOURS.map((h) => (
          <Chip key={h} label={`${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`} active={hour === h} onPress={() => setHour(h)} />
        ))}
      </View>
      <PrimaryButton label="Schedule visit" icon="event-available" onPress={save} disabled={!target || !purpose.trim()} />
    </Sheet>
  );
}

export const shadow = {
  shadowColor: '#1b1c1c',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
};

export const ui = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary, fontWeight: '600' },
  row: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },

  track: { backgroundColor: Colors.surfaceVariant, overflow: 'hidden' },

  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  gap: { marginTop: 16 },
  input: { height: 48, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, fontSize: 16, color: Colors.onSurface },
  inputFocused: { borderColor: Colors.primary, borderWidth: 2 },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 24 },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 8, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  card: { backgroundColor: Colors.card, borderRadius: 8, padding: 16, marginBottom: 12, ...shadow },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 12 },
  link: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
