import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

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

function SkillChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.skillChip, selected && styles.skillChipActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={[styles.skillChipText, selected && styles.skillChipTextActive]}>{label}</Text>
      {selected && <MaterialIcons name="check" size={14} color="#fff" />}
    </TouchableOpacity>
  );
}

export default function CreateWorkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [trade, setTrade] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [dailyRate, setDailyRate] = useState('');
  const [available, setAvailable] = useState(true);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [showTradePicker, setShowTradePicker] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const canContinue = () => {
    if (step === 0) return trade.length > 0 && selectedSkills.length > 0;
    if (step === 1) return dailyRate.length > 0 && phone.length > 0 && location.length > 0;
    return true;
  };

  const handleSubmit = () => {
    Alert.alert('Work Created!', 'Your work listing has been submitted for review and will be visible to clients soon.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.secondary, '#8a2e00', Colors.secondaryContainer]}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Work Listing</Text>
          <Text style={styles.headerStep}>{step + 1}/3</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
        </View>

        <View style={styles.stepLabels}>
          {['Skills', 'Details', 'Review'].map((s, i) => (
            <Text key={s} style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
          ))}
        </View>
      </LinearGradient>

      <KeyboardAwareWrapper
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>What's your trade?</Text>
            <TouchableOpacity style={styles.tradePicker} onPress={() => setShowTradePicker(true)} activeOpacity={0.7}>
              <MaterialIcons name="work" size={20} color={trade ? Colors.secondary : Colors.textLight} />
              <Text style={[styles.tradePickerText, !trade && styles.tradePickerPlaceholder]}>
                {trade || 'Select your trade'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            {trade.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Select your skills</Text>
                <Text style={styles.sectionSubtitle}>Choose all that apply</Text>
                <View style={styles.skillsGrid}>
                  {(SKILLS_LIST[trade] || []).map((skill) => (
                    <SkillChip key={skill} label={skill} selected={selectedSkills.includes(skill)} onToggle={() => toggleSkill(skill)} />
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Work details</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Daily Rate (₦)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 15000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={dailyRate}
                onChangeText={setDailyRate}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. +234 802 345 6789"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Ikeja, Lagos"
                placeholderTextColor={Colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldTextarea]}
                placeholder="Briefly describe your experience and services..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.availabilityRow}>
              <View>
                <Text style={styles.availabilityLabel}>Available for work</Text>
                <Text style={styles.availabilityHint}>{available ? 'You will appear in search results' : 'Hidden from search'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.availToggle, available && styles.availToggleActive]}
                onPress={() => setAvailable(!available)}
              >
                <View style={[styles.availKnob, available && styles.availKnobActive]} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Review your listing</Text>
            <Text style={styles.sectionSubtitle}>Make sure everything looks correct</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Trade</Text>
                <Text style={styles.reviewValue}>{trade}</Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Skills</Text>
                <View style={styles.reviewSkills}>
                  {selectedSkills.map((s) => (
                    <View key={s} style={styles.reviewSkillChip}>
                      <Text style={styles.reviewSkillChipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Daily Rate</Text>
                <Text style={styles.reviewValueBold}>₦{Number(dailyRate).toLocaleString('en-NG')}</Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Phone</Text>
                <Text style={styles.reviewValue}>{phone}</Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue}>{location}</Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Availability</Text>
                <View style={[styles.reviewStatus, { backgroundColor: available ? Colors.success + '15' : Colors.surfaceVariant }]}>
                  <View style={[styles.reviewStatusDot, { backgroundColor: available ? Colors.success : Colors.textLight }]} />
                  <Text style={[styles.reviewStatusText, { color: available ? Colors.success : Colors.textLight }]}>
                    {available ? 'Available' : 'Not Available'}
                  </Text>
                </View>
              </View>
              {description.length > 0 && (
                <>
                  <View style={styles.reviewDivider} />
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Description</Text>
                    <Text style={styles.reviewDesc}>{description}</Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </KeyboardAwareWrapper>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        {step > 0 && (
          <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canContinue() && styles.nextBtnDisabled]}
          disabled={!canContinue()}
          onPress={() => {
            if (step < 2) setStep(step + 1);
            else handleSubmit();
          }}
        >
          <Text style={[styles.nextBtnText, !canContinue() && styles.nextBtnTextDisabled]}>
            {step === 2 ? 'Submit Listing' : 'Continue'}
          </Text>
          <MaterialIcons name="arrow-forward" size={18} color={canContinue() ? '#fff' : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={showTradePicker} transparent animationType="fade" onRequestClose={() => setShowTradePicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTradePicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Trade</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {TRADES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalOption, trade === t && styles.modalOptionActive]}
                  onPress={() => { setTrade(t); setSelectedSkills([]); setShowTradePicker(false); }}
                >
                  <Text style={[styles.modalOptionText, trade === t && styles.modalOptionTextActive]}>{t}</Text>
                  {trade === t && <MaterialIcons name="check" size={18} color={Colors.secondary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingTop: 12,
  },

  /* ─── Header ─── */
  headerWrap: {
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  headerStep: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginHorizontal: 16,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  stepLabelActive: {
    color: '#fff',
  },

  /* ─── Section ─── */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMedium,
    marginTop: -12,
  },

  /* ─── Trade Picker ─── */
  tradePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tradePickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  tradePickerPlaceholder: {
    color: Colors.textMuted,
    fontWeight: '400',
  },

  /* ─── Skills ─── */
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  skillChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  skillChipTextActive: {
    color: '#fff',
  },

  /* ─── Fields ─── */
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  fieldInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  fieldTextarea: {
    minHeight: 100,
    paddingTop: 14,
  },

  /* ─── Availability ─── */
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  availabilityHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  availToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  availToggleActive: {
    backgroundColor: Colors.success,
  },
  availKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  availKnobActive: {
    alignSelf: 'flex-end',
  },

  /* ─── Review ─── */
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 0,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  reviewLabel: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
    minWidth: 80,
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
    flex: 1,
    textAlign: 'right',
  },
  reviewValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.secondary,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  reviewSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewSkillChip: {
    backgroundColor: Colors.secondary + '12',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reviewSkillChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
  },
  reviewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reviewStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewDesc: {
    fontSize: 13,
    color: Colors.textDark,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },

  /* ─── Bottom Bar ─── */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  backStepBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingVertical: 14,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  nextBtnTextDisabled: {
    color: Colors.textMuted,
  },

  /* ─── Modal ─── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 14,
  },
  modalList: {
    gap: 0,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalOptionActive: {
    backgroundColor: Colors.secondary + '08',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: -8,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  modalOptionTextActive: {
    color: Colors.secondary,
  },
});
