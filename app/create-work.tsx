import { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Colors } from '../constants/Colors';

const MAX_DESC = 300;

const TRADES = ['Mason', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Welder', 'Tiler', 'Designer', 'Steel Fabricator', 'Interior Designer'];

const SKILLS_LIST: Record<string, string[]> = {
  Mason: ['Block Laying', 'Plastering', 'Tiling', 'Rendering', 'Foundation Work', 'Concrete Mixing'],
  Electrician: ['Wiring', 'Panel Boards', 'Solar Install', 'CCTV', 'Lighting', 'Switch Installation'],
  Plumber: ['Pipe Fitting', 'Bathroom Install', 'Drainage', 'Borehole', 'Water Heater', 'Sink Install'],
  Carpenter: ['Roofing', 'Formwork', 'Doors & Windows', 'Furniture', 'Cabinet Making', 'Decking'],
  Painter: ['Interior Painting', 'Exterior Painting', 'Wallpaper', 'Textured Finish', 'Spray Painting'],
  Welder: ['Welding', 'Gate Fabrication', 'Roofing Trusses', 'Railings', 'Metal Works'],
  Tiler: ['Floor Tiles', 'Wall Tiles', 'Mosaic', 'Marble', 'Outdoor Tiling'],
  Designer: ['Space Planning', 'Decor', 'Lighting', '3D Rendering', 'Color Consulting'],
  'Steel Fabricator': ['Welding', 'Steel Cutting', 'Bending', 'Truss Assembly', 'Iron Works'],
  'Interior Designer': ['Space Planning', 'Decor', 'Furniture Selection', 'Lighting Design', 'Color Scheme'],
};

function Chip({ label, active, onPress, check }: { label: string; active: boolean; onPress: () => void; check?: boolean }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.7}>
      {check && active && <MaterialIcons name="check" size={16} color={Colors.onPrimary} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint && <Text style={styles.sectionHint}>{hint}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function CreateWorkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trade, setTrade] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [dailyRate, setDailyRate] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);
  const [focused, setFocused] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const phoneRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  const rate = Number(dailyRate) || 0;
  const errors: Record<string, string> = {};
  if (!trade) errors.trade = 'Pick your trade';
  if (!skills.length) errors.skills = 'Pick at least one skill';
  if (!rate) errors.rate = 'Enter your daily rate';
  if (phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a valid phone number';
  if (!location.trim()) errors.location = 'Enter where you work';
  const missing = Object.keys(errors).length;
  const err = (k: string) => (showErrors ? errors[k] : undefined);

  const pickTrade = (t: string) => {
    if (t === trade) return;
    setTrade(t);
    setSkills([]);
  };

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handlePublish = () => {
    if (missing) {
      setShowErrors(true);
      Alert.alert('Almost there', `Complete these first:\n• ${Object.values(errors).join('\n• ')}`);
      return;
    }
    Alert.alert('Listing submitted', 'Your work listing is under review and will be visible to clients soon.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const inputStyle = (k: string) => [styles.input, focused === k && styles.inputFocused, err(k) && styles.inputError];
  const focusProps = (k: string) => ({ onFocus: () => setFocused(k), onBlur: () => setFocused(null) });

  const footer = (
    <View style={[styles.footer, { paddingBottom: focused ? 12 : Math.max(16, insets.bottom + 8) }]}>
      <View style={styles.flex}>
        <Text style={styles.footerCount}>{missing ? `${missing} left` : 'Ready'}</Text>
        <Text style={styles.footerSub}>{missing ? 'to complete' : 'to publish'}</Text>
      </View>
      <TouchableOpacity style={[styles.publishBtn, !!missing && styles.publishIdle]} onPress={handlePublish} activeOpacity={0.8}>
        <Text style={styles.publishText}>Publish</Text>
        <MaterialIcons name="arrow-forward" size={18} color={Colors.onSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'New Work Listing', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((5 - missing) / 5) * 100}%` }]} />
      </View>

      <KeyboardAwareWrapper contentContainerStyle={styles.content} footer={footer}>
        <Section title="Your trade" hint="Clients search by trade first">
          <View style={styles.chipWrap}>
            {TRADES.map((t) => <Chip key={t} label={t} active={trade === t} onPress={() => pickTrade(t)} />)}
          </View>
          {err('trade') && <Text style={styles.errorText}>{err('trade')}</Text>}
        </Section>

        {trade !== '' && (
          <Section title="Skills" hint={skills.length ? `${skills.length} selected` : 'Choose all that apply'}>
            <View style={styles.chipWrap}>
              {SKILLS_LIST[trade].map((s) => <Chip key={s} label={s} active={skills.includes(s)} onPress={() => toggleSkill(s)} check />)}
            </View>
            {err('skills') && <Text style={styles.errorText}>{err('skills')}</Text>}
          </Section>
        )}

        <Section title="Rate & contact">
          <Text style={styles.label}>Daily rate</Text>
          <View style={[styles.rateBox, focused === 'rate' && styles.inputFocused, err('rate') && styles.inputError]}>
            <Text style={styles.rateSymbol}>₦</Text>
            <TextInput
              style={styles.rateInput}
              placeholder="15,000"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              value={rate ? rate.toLocaleString('en-NG') : ''}
              onChangeText={(t) => setDailyRate(t.replace(/\D/g, ''))}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              {...focusProps('rate')}
            />
            <Text style={styles.rateSuffix}>/ day</Text>
          </View>
          {err('rate') && <Text style={styles.errorText}>{err('rate')}</Text>}

          <Text style={[styles.label, styles.labelGap]}>Phone number</Text>
          <TextInput
            ref={phoneRef}
            style={inputStyle('phone')}
            placeholder="+234 802 345 6789"
            placeholderTextColor={Colors.outline}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            returnKeyType="next"
            onSubmitEditing={() => locationRef.current?.focus()}
            {...focusProps('phone')}
          />
          {err('phone') && <Text style={styles.errorText}>{err('phone')}</Text>}

          <Text style={[styles.label, styles.labelGap]}>Where you work</Text>
          <TextInput
            ref={locationRef}
            style={inputStyle('location')}
            placeholder="e.g. Ikeja, Lagos"
            placeholderTextColor={Colors.outline}
            value={location}
            onChangeText={setLocation}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            {...focusProps('location')}
          />
          {err('location') && <Text style={styles.errorText}>{err('location')}</Text>}
        </Section>

        <Section title="About your work" hint="Optional, but listings with a short intro get more calls">
          <TextInput
            ref={descRef}
            style={[...inputStyle('desc'), styles.textArea]}
            placeholder="Years of experience, past projects, tools you bring…"
            placeholderTextColor={Colors.outline}
            multiline
            maxLength={MAX_DESC}
            value={description}
            onChangeText={setDescription}
            {...focusProps('desc')}
          />
          <Text style={styles.counter}>{description.length}/{MAX_DESC}</Text>
        </Section>

        <View style={[styles.card, styles.availRow]}>
          <View style={styles.flex}>
            <Text style={styles.availTitle}>Available for work</Text>
            <Text style={styles.availHint}>{available ? 'You appear in client searches' : 'Hidden from searches'}</Text>
          </View>
          <Switch
            value={available}
            onValueChange={setAvailable}
            trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
            thumbColor="#fff"
            ios_backgroundColor={Colors.outlineVariant}
          />
        </View>
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  flex: { flex: 1 },

  progressTrack: { height: 4, backgroundColor: Colors.surfaceVariant },
  progressFill: { height: 4, backgroundColor: Colors.primary },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface, lineHeight: 28 },
  sectionHint: { fontSize: 14, color: Colors.outline, lineHeight: 20, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, height: 40, borderRadius: 999, backgroundColor: Colors.surfaceVariant + '99' },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onPrimary, fontWeight: '600' },

  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8 },
  labelGap: { marginTop: 16 },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
    fontSize: 16,
    color: Colors.onSurface,
  },
  inputFocused: { borderColor: Colors.primary, borderWidth: 2 },
  inputError: { borderColor: Colors.error },
  textArea: { height: 112, paddingTop: 12, textAlignVertical: 'top' },
  counter: { fontSize: 12, color: Colors.outline, textAlign: 'right', marginTop: 4 },
  errorText: { fontSize: 12, fontWeight: '500', color: Colors.error, marginTop: 6 },

  rateBox: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  rateSymbol: { fontSize: 22, fontWeight: '700', color: Colors.onSurface, marginRight: 4 },
  rateInput: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.onSurface, paddingVertical: 0 },
  rateSuffix: { fontSize: 14, color: Colors.outline },

  availRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 0 },
  availTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  availHint: { fontSize: 13, color: Colors.outline, marginTop: 2 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerCount: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  footerSub: { fontSize: 12, color: Colors.outline },
  publishBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 28, borderRadius: 999, backgroundColor: Colors.secondary },
  publishIdle: { opacity: 0.6 },
  publishText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
});
