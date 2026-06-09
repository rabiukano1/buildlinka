import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { CATEGORIES, TRADES } from '../constants/MockData';

const { width, height } = Dimensions.get('window');
const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Renovation'];
const PROJECT_SIZES = ['Small (1-2 rooms)', 'Medium (3-4 rooms)', 'Large (5+ rooms)', 'Estate / Complex'];
const PAYMENT_PLANS = ['Full Payment', 'Milestone Based', '50% Deposit + Balance', 'Phased (per stage)'];
const DURATIONS = ['1-2 weeks', '3-4 weeks', '1-3 months', '3-6 months', '6+ months'];
const BUDGET_RANGES = [
  { label: 'Budget Friendly', range: '₦500K - ₦2M', min: 500000, max: 2000000 },
  { label: 'Standard', range: '₦2M - ₦5M', min: 2000000, max: 5000000 },
  { label: 'Premium', range: '₦5M - ₦15M', min: 5000000, max: 15000000 },
  { label: 'Luxury', range: '₦15M+', min: 15000000, max: 50000000 },
];

const TRADE_WORKERS = TRADES.filter((t) => t !== 'All').map((t) => ({ trade: t, count: 1 }));
const MATERIAL_PRESETS = CATEGORIES.slice(0, 8).map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, selected: false, note: '' }));

type AIChatMessage = {
  role: 'user' | 'ai';
  text: string;
  suggestions?: {
    type?: string;
    size?: string;
    duration?: string;
    budget?: string;
    paymentPlan?: string;
    materials?: { name: string; note: string }[];
    workers?: { trade: string; count: number }[];
    totalEstimate?: string;
    breakdown?: { label: string; amount: string; pct: number; color: string }[];
  };
};

type ProjectTemplate = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  presets: {
    type: string;
    size: string;
    duration: string;
    budget: string;
    paymentPlan: string;
    materials: { name: string; note: string }[];
    workers: { trade: string; count: number }[];
  };
};

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 't1', name: '3-Bedroom Bungalow', desc: 'Standard residential with living, dining, kitchen, 3 bedrooms, 2 bathrooms',
    icon: '🏠', presets: {
      type: 'Residential', size: 'Medium (3-4 rooms)', duration: '3-6 months', budget: 'Premium', paymentPlan: 'Milestone Based',
      materials: [
        { name: 'Cement', note: '~450 bags' }, { name: 'Steel & Iron', note: '~3.5 tons 12mm/16mm' },
        { name: 'Roofing', note: '200sqm roofing sheets' }, { name: 'Plumbing', note: 'Full plumbing kit' },
        { name: 'Tiles', note: '~80sqm floor/wall tiles' }, { name: 'Electrical', note: 'Full wiring kit' },
        { name: 'Paint', note: '~10 pails emulsion + 5 pails gloss' }, { name: 'Timber', note: 'Doors, frames, cabinets' },
      ],
      workers: [
        { trade: 'Mason', count: 4 }, { trade: 'Electrician', count: 2 }, { trade: 'Plumber', count: 2 },
        { trade: 'Carpenter', count: 3 }, { trade: 'Painter', count: 2 }, { trade: 'Tiler', count: 2 },
      ],
    },
  },
  {
    id: 't2', name: 'Duplex / Mansion', desc: 'Multi-level luxury with en-suite bedrooms, modern finishes, premium fixtures',
    icon: '🏛️', presets: {
      type: 'Residential', size: 'Large (5+ rooms)', duration: '6+ months', budget: 'Luxury', paymentPlan: 'Phased (per stage)',
      materials: [
        { name: 'Cement', note: '~800 bags' }, { name: 'Steel & Iron', note: '~6 tons' },
        { name: 'Roofing', note: '350sqm premium tiles' }, { name: 'Plumbing', note: 'Premium fixtures x3 bathrooms' },
        { name: 'Tiles', note: '~150sqm marble/ceramic' }, { name: 'Electrical', note: 'Full smart wiring' },
        { name: 'Paint', note: 'Premium interior/exterior' }, { name: 'Timber', note: 'Solid wood doors, staircase' },
      ],
      workers: [
        { trade: 'Mason', count: 6 }, { trade: 'Electrician', count: 3 }, { trade: 'Plumber', count: 3 },
        { trade: 'Carpenter', count: 4 }, { trade: 'Painter', count: 3 }, { trade: 'Tiler', count: 3 },
        { trade: 'Designer', count: 1 }, { trade: 'Welder', count: 2 },
      ],
    },
  },
  {
    id: 't3', name: 'Shop / Office', desc: 'Commercial space with reception, workstations, storage, restroom',
    icon: '🏢', presets: {
      type: 'Commercial', size: 'Medium (3-4 rooms)', duration: '1-3 months', budget: 'Standard', paymentPlan: '50% Deposit + Balance',
      materials: [
        { name: 'Cement', note: '~200 bags' }, { name: 'Steel & Iron', note: '~1.5 tons' },
        { name: 'Plumbing', note: 'Small restroom kit' }, { name: 'Electrical', note: 'Workstation wiring' },
        { name: 'Paint', note: 'Commercial emulsion' }, { name: 'Tiles', note: '~50sqm vinyl/tiles' },
      ],
      workers: [
        { trade: 'Mason', count: 3 }, { trade: 'Electrician', count: 1 }, { trade: 'Plumber', count: 1 },
        { trade: 'Painter', count: 2 }, { trade: 'Tiler', count: 1 },
      ],
    },
  },
];

const AI_RESPONSES: Record<string, AIChatMessage> = {
  default: {
    role: 'ai', text: 'Great question! Based on your description, I can help you plan everything. Could you tell me more about:\n\n• What type of structure?\n• How many floors/rooms?\n• Your estimated budget range?\n• Preferred timeline?\n\nI\'ll generate a full plan with cost breakdown, materials, and workers needed!',
  },
  residential: {
    role: 'ai', text: 'Perfect! I\'ll help you build a detailed residential plan. Here\'s what I recommend:',
    suggestions: {
      type: 'Residential', size: 'Medium (3-4 rooms)', duration: '3-6 months', budget: 'Premium',
      paymentPlan: 'Milestone Based',
      materials: [
        { name: 'Cement', note: '~450 bags of Dangote 42.5R' },
        { name: 'Steel & Iron', note: '~3.5 tons (12mm & 16mm rods)' },
        { name: 'Roofing', note: '200sqm longspan aluminum' },
        { name: 'Plumbing', note: 'Full PPR piping + 3 bathrooms' },
        { name: 'Electrical', note: 'Full wiring + 15 points' },
        { name: 'Tiles', note: '~80sqm floor + wall tiles' },
        { name: 'Paint', note: '10 pails emulsion + 5 gloss' },
      ],
      workers: [
        { trade: 'Mason', count: 4 }, { trade: 'Electrician', count: 2 },
        { trade: 'Plumber', count: 2 }, { trade: 'Carpenter', count: 3 },
        { trade: 'Painter', count: 2 }, { trade: 'Tiler', count: 2 },
      ],
      totalEstimate: '₦8.5M - ₦12M',
      breakdown: [
        { label: 'Materials', amount: '₦4.8M', pct: 48, color: '#2563eb' },
        { label: 'Labor', amount: '₦2.8M', pct: 28, color: '#7c3aed' },
        { label: 'Finishing', amount: '₦1.5M', pct: 15, color: '#d97706' },
        { label: 'Contingency', amount: '₦0.9M', pct: 9, color: '#0891b2' },
      ],
    },
  },
  commercial: {
    role: 'ai', text: 'Great commercial project! Here\'s a tailored plan for your business space:',
    suggestions: {
      type: 'Commercial', size: 'Medium (3-4 rooms)', duration: '1-3 months', budget: 'Standard',
      paymentPlan: '50% Deposit + Balance',
      materials: [
        { name: 'Cement', note: '~200 bags' },
        { name: 'Steel & Iron', note: '~1.5 tons' },
        { name: 'Plumbing', note: 'Restroom + kitchenette' },
        { name: 'Electrical', note: 'Workstation wiring + AC points' },
        { name: 'Paint', note: 'Commercial grade emulsion' },
        { name: 'Tiles', note: '~50sqm commercial vinyl' },
      ],
      workers: [
        { trade: 'Mason', count: 3 }, { trade: 'Electrician', count: 1 },
        { trade: 'Plumber', count: 1 }, { trade: 'Painter', count: 2 },
        { trade: 'Tiler', count: 1 }, { trade: 'Welder', count: 1 },
      ],
      totalEstimate: '₦3.5M - ₦5.5M',
      breakdown: [
        { label: 'Materials', amount: '₦2.0M', pct: 45, color: '#2563eb' },
        { label: 'Labor', amount: '₦1.2M', pct: 27, color: '#7c3aed' },
        { label: 'Finishing', amount: '₦0.8M', pct: 18, color: '#d97706' },
        { label: 'Contingency', amount: '₦0.5M', pct: 10, color: '#0891b2' },
      ],
    },
  },
  renovation: {
    role: 'ai', text: 'Renovation is a great way to refresh your space! Here\'s my recommended plan:',
    suggestions: {
      type: 'Renovation', size: 'Small (1-2 rooms)', duration: '3-4 weeks', budget: 'Budget Friendly',
      paymentPlan: 'Full Payment',
      materials: [
        { name: 'Cement', note: '~50 bags for patching' },
        { name: 'Plumbing', note: 'Replace fittings' },
        { name: 'Electrical', note: 'Rewire + new fixtures' },
        { name: 'Paint', note: '5 pails emulsion' },
        { name: 'Tiles', note: '~20sqm replacement' },
      ],
      workers: [
        { trade: 'Mason', count: 1 }, { trade: 'Electrician', count: 1 },
        { trade: 'Plumber', count: 1 }, { trade: 'Painter', count: 2 },
        { trade: 'Tiler', count: 1 },
      ],
      totalEstimate: '₦800K - ₦1.5M',
      breakdown: [
        { label: 'Materials', amount: '₦550K', pct: 42, color: '#2563eb' },
        { label: 'Labor', amount: '₦400K', pct: 30, color: '#7c3aed' },
        { label: 'Finishing', amount: '₦200K', pct: 15, color: '#d97706' },
        { label: 'Contingency', amount: '₦150K', pct: 13, color: '#0891b2' },
      ],
    },
  },
};

function SparkleIcon() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(rot, { toValue: 1, duration: 3000, useNativeDriver: true })).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <MaterialIcons name="auto-awesome" size={18} color="#fff" />
    </Animated.View>
  );
}

function AnimatedChip({ label, selected, onPress, emoji }: { label: string; selected: boolean; onPress: () => void; emoji?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={() => { Animated.sequence([Animated.timing(scale, { toValue: 0.93, duration: 80, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true })]).start(); onPress(); }}
      activeOpacity={1}
    >
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, transform: [{ scale }] }}>
        {emoji && <Text style={{ fontSize: 15 }}>{emoji}</Text>}
        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CounterChip({ label, count, onInc, onDec, emoji }: { label: string; count: number; onInc: () => void; onDec: () => void; emoji?: string }) {
  return (
    <View style={styles.counterChip}>
      <View style={styles.counterLeft}>
        {emoji && <Text style={{ fontSize: 16 }}>{emoji}</Text>}
        <Text style={styles.counterLabel}>{label}</Text>
      </View>
      <View style={styles.counterControls}>
        <TouchableOpacity style={[styles.counterBtn, count === 0 && styles.counterBtnDisabled]} onPress={onDec} activeOpacity={0.6}>
          <MaterialIcons name="remove" size={16} color={count > 0 ? Colors.textDark : Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{count}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={onInc} activeOpacity={0.6}>
          <MaterialIcons name="add" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MaterialSelector({ material, onToggle, onNoteChange }: { material: typeof MATERIAL_PRESETS[0]; onToggle: () => void; onNoteChange: (n: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      style={[styles.matCard, material.selected && styles.matCardActive]}
      onPress={() => { Animated.sequence([Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true })]).start(); onToggle(); }}
      activeOpacity={1}
    >
      <Animated.View style={[styles.matInner, { transform: [{ scale }] }]}>
        <View style={[styles.matCheck, material.selected && styles.matCheckActive]}>
          {material.selected && <MaterialIcons name="check" size={14} color="#fff" />}
        </View>
        <View style={[styles.matIcon, { backgroundColor: material.color + '15' }]}>
          <MaterialIcons name={material.icon as any} size={20} color={material.color} />
        </View>
        <View style={styles.matInfo}>
          <Text style={styles.matName}>{material.name}</Text>
          {material.selected && (
            <TextInput style={styles.matNote} placeholder="Quantity / details..." placeholderTextColor={Colors.textMuted} value={material.note} onChangeText={onNoteChange} />
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <View style={styles.sumRow}>
      <View style={[styles.sumIcon, { backgroundColor: (color || Colors.primary) + '10' }]}>
        <MaterialIcons name={icon as any} size={16} color={color || Colors.primary} />
      </View>
      <View style={styles.sumInfo}>
        <Text style={styles.sumLabel}>{label}</Text>
        <Text style={styles.sumValue}>{value}</Text>
      </View>
    </View>
  );
}

function CostBreakdownCard({ items }: { items: { label: string; amount: string; pct: number; color: string }[] }) {
  return (
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>Expected Cost Breakdown</Text>
      <View style={styles.breakdownBarWrap}>
        {items.map((item) => (
          <View key={item.label} style={[styles.breakdownBar, { flex: item.pct, backgroundColor: item.color }]} />
        ))}
      </View>
      <View style={styles.breakdownLegend}>
        {items.map((item) => (
          <View key={item.label} style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
            <Text style={styles.breakdownLabel}>{item.label}</Text>
            <Text style={styles.breakdownValue}>{item.amount}</Text>
            <Text style={styles.breakdownPct}>{item.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AIChatBubble({ message }: { message: AIChatMessage }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.chatBubbleWrap, message.role === 'user' ? styles.chatUser : styles.chatAI, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {message.role === 'ai' && (
        <View style={styles.chatAIAvatar}>
          <MaterialIcons name="auto-awesome" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.chatBubble, message.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI]}>
        <Text style={[styles.chatText, message.role === 'user' && styles.chatTextUser]}>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

function ProjectTemplateCard({ template, onApply }: { template: ProjectTemplate; onApply: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: 100, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.templateCard, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      <Text style={styles.templateIcon}>{template.icon}</Text>
      <Text style={styles.templateName}>{template.name}</Text>
      <Text style={styles.templateDesc} numberOfLines={2}>{template.desc}</Text>
      <TouchableOpacity style={styles.templateBtn} onPress={onApply} activeOpacity={0.7}>
        <Text style={styles.templateBtnText}>Use Template</Text>
        <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function ApplySuggestionsBanner({ suggestions, onApply }: { suggestions: AIChatMessage['suggestions']; onApply: () => void }) {
  return (
    <Animated.View style={styles.applyBanner}>
      <View style={styles.applyBannerLeft}>
        <MaterialIcons name="auto-awesome" size={18} color="#fff" />
        <View style={styles.applyBannerInfo}>
          <Text style={styles.applyBannerTitle}>AI Plan Ready</Text>
          <Text style={styles.applyBannerSub}>Auto-fill all project fields with AI suggestions</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.7}>
        <Text style={styles.applyBtnText}>Apply</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: (step + 1) / total, friction: 10, tension: 60, useNativeDriver: false }).start();
  }, [step]);

  const steps = ['Basics', 'Budget', 'Materials', 'Workers', 'Review'];

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        {steps.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive, { left: `${((i + 0.5) / total) * 100}%` }]} />
        ))}
      </View>
      <View style={styles.stepLabels}>
        {steps.map((l, i) => (
          <Text key={l} style={[styles.stepLabel, i === step && styles.stepLabelCurrent, i < step && styles.stepLabelDone]}>{i < step ? '✓' : l}</Text>
        ))}
      </View>
    </View>
  );
}

export default function BuildProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectSize, setProjectSize] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('');
  const [materials, setMaterials] = useState(MATERIAL_PRESETS.map((m) => ({ ...m })));
  const [workers, setWorkers] = useState(TRADE_WORKERS.map((w) => ({ ...w })));
  const [submitted, setSubmitted] = useState(false);

  const [showAI, setShowAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AIChatMessage['suggestions'] | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const aiAnim = useRef(new Animated.Value(0)).current;
  const inputOffset = useRef(new Animated.Value(0)).current;
  const insetsBottom = insets.bottom || 8;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      Animated.timing(inputOffset, { toValue: e.endCoordinates.height + insetsBottom, duration: 250, useNativeDriver: false }).start();
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      Animated.timing(inputOffset, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const toggleMaterial = (id: string) => setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
  const updateMaterialNote = (id: string, note: string) => setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, note } : m)));
  const updateWorker = (trade: string, delta: number) => setWorkers((prev) => prev.map((w) => (w.trade === trade ? { ...w, count: Math.max(0, w.count + delta) } : w)));

  const selectedMatCount = materials.filter((m) => m.selected).length;
  const totalWorkers = workers.reduce((s, w) => s + w.count, 0);
  const selectedWorkers = workers.filter((w) => w.count > 0);
  const budgetObj = BUDGET_RANGES.find((b) => b.label === budget);

  const canProceed = () => {
    switch (step) {
      case 0: return projectName.trim().length > 0 && projectType !== '' && projectSize !== '' && location.trim().length > 0;
      case 1: return duration !== '' && budget !== '' && paymentPlan !== '';
      case 2: return selectedMatCount > 0;
      case 3: return totalWorkers > 0;
      default: return true;
    }
  };

  const applyAISuggestions = (suggestions: AIChatMessage['suggestions']) => {
    if (!suggestions) return;
    if (suggestions.type) setProjectType(suggestions.type);
    if (suggestions.size) setProjectSize(suggestions.size);
    if (suggestions.duration) setDuration(suggestions.duration);
    if (suggestions.budget) setBudget(suggestions.budget);
    if (suggestions.paymentPlan) setPaymentPlan(suggestions.paymentPlan);
    if (suggestions.materials) {
      setMaterials((prev) => prev.map((m) => {
        const match = suggestions.materials!.find((sm) => sm.name === m.name);
        return match ? { ...m, selected: true, note: match.note } : m;
      }));
    }
    if (suggestions.workers) {
      setWorkers((prev) => prev.map((w) => {
        const match = suggestions.workers!.find((sw) => sw.trade === w.trade);
        return match ? { ...w, count: match.count } : { ...w, count: 0 };
      }));
    }
    applyTemplateName(suggestions);
    setAiSuggestions(null);
    setShowAI(false);
  };

  const applyTemplateName = (s: AIChatMessage['suggestions']) => {
    if (s?.type === 'Residential' && projectName === '') setProjectName(s.size?.includes('3-4') ? 'My 3-Bedroom Bungalow' : 'My Residential Project');
    else if (s?.type === 'Commercial' && projectName === '') setProjectName('My Commercial Space');
    else if (s?.type === 'Renovation' && projectName === '') setProjectName('Home Renovation');
  };

  const applyTemplate = (template: ProjectTemplate) => {
    const s = template.presets;
    setProjectName(template.name.startsWith('My ') ? template.name : `My ${template.name}`);
    setProjectType(s.type);
    setProjectSize(s.size);
    setDuration(s.duration);
    setBudget(s.budget);
    setPaymentPlan(s.paymentPlan);
    setMaterials((prev) => prev.map((m) => {
      const match = s.materials.find((sm) => sm.name === m.name);
      return match ? { ...m, selected: true, note: match.note } : m;
    }));
    setWorkers((prev) => prev.map((w) => {
      const match = s.workers.find((sw) => sw.trade === w.trade);
      return match ? { ...w, count: match.count } : { ...w, count: 0 };
    }));
    setShowAI(false);
  };

  const handleAISend = () => {
    if (!chatInput.trim()) return;
    const userMsg: AIChatMessage = { role: 'user', text: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setAiThinking(true);

    setTimeout(() => {
      const lower = userMsg.text.toLowerCase();
      let response: AIChatMessage;
      if (lower.includes('residential') || lower.includes('house') || lower.includes('home') || lower.includes('bungalow') || lower.includes('duplex') || lower.includes('flat')) {
        response = AI_RESPONSES.residential;
      } else if (lower.includes('commercial') || lower.includes('shop') || lower.includes('office') || lower.includes('store') || lower.includes('business')) {
        response = AI_RESPONSES.commercial;
      } else if (lower.includes('renovate') || lower.includes('renovation') || lower.includes('remodel') || lower.includes('repair') || lower.includes('fix')) {
        response = AI_RESPONSES.renovation;
      } else {
        response = AI_RESPONSES.default;
      }
      setAiSuggestions(response.suggestions || null);
      setChatMessages((prev) => [...prev, response]);
      setAiThinking(false);
    }, 1200);
  };

  const openAI = () => {
    setShowAI(true);
    setChatMessages([{ role: 'ai', text: '👋 Hi! I\'m your AI building assistant. Tell me what you want to build and I\'ll create a complete project plan with cost estimates, materials, and workers needed!\n\n**Try saying:** _"I want to build a 3-bedroom bungalow in Lekki"_ or _"I need to renovate my 2-bedroom flat"_' }]);
    setAiSuggestions(null);
    Animated.spring(aiAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
  };

  const closeAI = () => {
    Animated.timing(aiAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowAI(false));
  };

  const handleSubmit = () => setSubmitted(true);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View>
                <Text style={styles.stepTitle}>Project Basics</Text>
                <Text style={styles.stepSub}>Describe your construction project</Text>
              </View>
              <TouchableOpacity style={styles.stepAIHint} onPress={openAI} activeOpacity={0.7}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                <Text style={styles.stepAIHintText}>AI Help</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Name</Text>
              <TextInput style={styles.input} placeholder="e.g. My 3-Bedroom Duplex" placeholderTextColor={Colors.textMuted} value={projectName} onChangeText={setProjectName} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Type</Text>
              <View style={styles.chipRow}>
                {PROJECT_TYPES.map((t) => (
                  <AnimatedChip key={t} label={t} selected={projectType === t} onPress={() => setProjectType(t)} emoji={t === 'Residential' ? '🏠' : t === 'Commercial' ? '🏢' : t === 'Industrial' ? '🏭' : '🔨'} />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Project Size</Text>
              <View style={styles.chipRow}>
                {PROJECT_SIZES.map((s) => (
                  <AnimatedChip key={s} label={s} selected={projectSize === s} onPress={() => setProjectSize(s)} emoji={s.startsWith('Small') ? '🛋️' : s.startsWith('Medium') ? '🏠' : s.startsWith('Large') ? '🏛️' : '🏘️'} />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Site Location</Text>
              <TextInput style={styles.input} placeholder="e.g. Lekki Phase 1, Lagos" placeholderTextColor={Colors.textMuted} value={location} onChangeText={setLocation} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description <Text style={{ color: Colors.textMuted, fontWeight: '400', textTransform: 'none' }}>(optional, helps AI plan better)</Text></Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your project scope, special requirements, site conditions..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
            </View>

            <TouchableOpacity style={styles.aiQuickBtn} onPress={openAI} activeOpacity={0.7}>
              <MaterialIcons name="auto-awesome" size={18} color="#fff" />
              <Text style={styles.aiQuickBtnText}>Let AI Plan My Project</Text>
              <MaterialIcons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View>
                <Text style={styles.stepTitle}>Timeline & Budget</Text>
                <Text style={styles.stepSub}>Set schedule and financial plan</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Estimated Duration</Text>
              <View style={styles.chipRow}>
                {DURATIONS.map((d) => (
                  <AnimatedChip key={d} label={d} selected={duration === d} onPress={() => setDuration(d)} emoji={d.includes('week') ? '📅' : d.includes('month') ? '📆' : '🗓️'} />
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Budget Range</Text>
              <View style={styles.budgetGrid}>
                {BUDGET_RANGES.map((b) => (
                  <TouchableOpacity key={b.label} style={[styles.budgetCard, budget === b.label && styles.budgetCardActive]} onPress={() => setBudget(b.label)} activeOpacity={0.7}>
                    <View style={styles.budgetCardTop}>
                      <MaterialIcons name={budget === b.label ? 'radio-button-checked' : 'radio-button-unchecked'} size={16} color={budget === b.label ? Colors.primary : Colors.textMuted} />
                      <Text style={[styles.budgetLabel, budget === b.label && styles.budgetLabelActive]}>{b.label}</Text>
                    </View>
                    <Text style={styles.budgetRange}>{b.range}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Payment Plan</Text>
              <View style={styles.chipRow}>
                {PAYMENT_PLANS.map((p) => (
                  <AnimatedChip key={p} label={p} selected={paymentPlan === p} onPress={() => setPaymentPlan(p)} />
                ))}
              </View>
            </View>

            {budgetObj && (
              <View style={styles.budgetSummary}>
                <MaterialIcons name="info" size={16} color={Colors.primary} />
                <Text style={styles.budgetSummaryText}>Estimated budget: {budgetObj.range} ({budgetObj.label})</Text>
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View>
                <Text style={styles.stepTitle}>Materials Needed</Text>
                <Text style={styles.stepSub}>Select what materials your project requires</Text>
              </View>
              <TouchableOpacity style={styles.stepAIHint} onPress={openAI} activeOpacity={0.7}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                <Text style={styles.stepAIHintText}>AI Suggest</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedCount}>
              <MaterialIcons name="check-circle" size={15} color={Colors.primary} />
              <Text style={styles.selectedCountText}>{selectedMatCount} of {materials.length} selected</Text>
            </View>

            {materials.map((m) => (
              <MaterialSelector key={m.id} material={m} onToggle={() => toggleMaterial(m.id)} onNoteChange={(n) => updateMaterialNote(m.id, n)} />
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View>
                <Text style={styles.stepTitle}>Workers Needed</Text>
                <Text style={styles.stepSub}>Select trades and number of workers</Text>
              </View>
              <TouchableOpacity style={styles.stepAIHint} onPress={openAI} activeOpacity={0.7}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                <Text style={styles.stepAIHintText}>AI Suggest</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedCount}>
              <MaterialIcons name="people" size={15} color={Colors.primary} />
              <Text style={styles.selectedCountText}>{totalWorkers} workers · {selectedWorkers.length} trades</Text>
            </View>

            {workers.map((w) => (
              <CounterChip key={w.trade} label={w.trade} count={w.count} onInc={() => updateWorker(w.trade, 1)} onDec={() => updateWorker(w.trade, -1)}
                emoji={w.trade === 'Mason' ? '🧱' : w.trade === 'Electrician' ? '⚡' : w.trade === 'Plumber' ? '🔧' : w.trade === 'Carpenter' ? '🪚' : w.trade === 'Painter' ? '🎨' : w.trade === 'Welder' ? '⚙️' : w.trade === 'Tiler' ? '🏛️' : '📐'}
              />
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View>
                <Text style={styles.stepTitle}>Review & Confirm</Text>
                <Text style={styles.stepSub}>Final review before submission</Text>
              </View>
              <TouchableOpacity style={styles.stepAIHint} onPress={openAI} activeOpacity={0.7}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                <Text style={styles.stepAIHintText}>Estimate</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewSection}>📋 Project</Text>
              <SummaryRow label="Name" value={projectName} icon="edit" color={Colors.primary} />
              <SummaryRow label="Type" value={projectType} icon="category" color={Colors.primary} />
              <SummaryRow label="Size" value={projectSize} icon="square-foot" color={Colors.primary} />
              <SummaryRow label="Location" value={location} icon="location-on" color={Colors.primary} />
              {!!description && <SummaryRow label="Description" value={description.slice(0, 80) + (description.length > 80 ? '...' : '')} icon="description" color={Colors.primary} />}

              <View style={styles.reviewDivider} />
              <Text style={styles.reviewSection}>💰 Budget & Time</Text>
              <SummaryRow label="Duration" value={duration} icon="schedule" color={Colors.secondary} />
              <SummaryRow label="Budget" value={budgetObj ? budgetObj.range : budget} icon="account-balance-wallet" color={Colors.secondary} />
              <SummaryRow label="Payment" value={paymentPlan} icon="payments" color={Colors.secondary} />

              {aiSuggestions?.breakdown && <CostBreakdownCard items={aiSuggestions.breakdown} />}

              <View style={styles.reviewDivider} />
              <Text style={styles.reviewSection}>🧱 Materials ({selectedMatCount})</Text>
              {materials.filter((m) => m.selected).map((m) => (
                <SummaryRow key={m.id} label={m.name} value={m.note || 'Selected'} icon="check-circle" color={m.color} />
              ))}

              <View style={styles.reviewDivider} />
              <Text style={styles.reviewSection}>👷 Workers ({totalWorkers})</Text>
              {selectedWorkers.map((w) => (
                <SummaryRow key={w.trade} label={w.trade} value={`${w.count} worker${w.count > 1 ? 's' : ''}`} icon="handyman" color={Colors.primaryGreen} />
              ))}
            </View>
          </View>
        );
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[Colors.primary, '#0a5215']} style={[styles.successWrap, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.successContent}>
            <View style={styles.successIconWrap}>
              <View style={styles.successIconRing} />
              <MaterialIcons name="check-circle" size={56} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Project Created!</Text>
            <Text style={styles.successSub}>Your project has been submitted. We'll match you with the best vendors and workers for your build.</Text>
            <View style={styles.successMeta}>
              <Text style={styles.successMetaLabel}>Project</Text>
              <Text style={styles.successMetaValue}>{projectName}</Text>
              <Text style={styles.successMetaLabel}>Estimated Budget</Text>
              <Text style={[styles.successMetaValue, { color: '#4cdf8b' }]}>{budgetObj ? budgetObj.range : budget}</Text>
            </View>
            <TouchableOpacity style={styles.successBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.successBtnText}>Back to Dashboard</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[Colors.primary, '#063d0e']} style={[styles.headerWrap, { paddingTop: insets.top }]} start={{ x: 0, y: 0 }} end={{ x: 1.2, y: 1.2 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Build Project</Text>
            <Text style={styles.headerSub}>Step {step + 1} · {['Basics', 'Budget', 'Materials', 'Workers', 'Review'][step]}</Text>
          </View>
          <TouchableOpacity style={styles.headerAIBtn} onPress={openAI} activeOpacity={0.7}>
            <SparkleIcon />
          </TouchableOpacity>
        </View>
        <ProgressBar step={step} total={5} />
      </LinearGradient>

      {aiSuggestions && (
        <ApplySuggestionsBanner suggestions={aiSuggestions} onApply={() => applyAISuggestions(aiSuggestions)} />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          {step > 0 && (
            <TouchableOpacity style={styles.backStepBtn} onPress={() => { setStep(step - 1); fadeAnim.setValue(0); }} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={18} color={Colors.textDark} />
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]} onPress={() => { if (step < 4) { setStep(step + 1); fadeAnim.setValue(0); scrollRef.current?.scrollTo({ y: 0, animated: true }); } else { handleSubmit(); } }} activeOpacity={0.7} disabled={!canProceed()}>
            <Text style={styles.nextBtnText}>{step < 4 ? 'Continue' : 'Submit Project'}</Text>
            <MaterialIcons name={step < 4 ? 'arrow-forward' : 'check'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showAI} transparent animationType="none" onRequestClose={closeAI}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => Keyboard.dismiss()}>
          <Animated.View style={[styles.aiOverlay, { opacity: aiAnim }]}>
            <Animated.View style={[styles.aiPanel, { transform: [{ translateY: aiAnim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.4, 0] }) }] }]}>
              <View style={styles.aiPanelHandle}>
                <View style={styles.aiHandle} />
              </View>

              <View style={styles.aiPanelHeader}>
                <View style={styles.aiPanelTitleRow}>
                  <View style={styles.aiPanelIcon}>
                    <MaterialIcons name="auto-awesome" size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.aiPanelTitle}>AI Building Assistant</Text>
                    <Text style={styles.aiPanelSub}>Describe your project for a full plan</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.aiPanelClose} onPress={closeAI} activeOpacity={0.7}>
                  <MaterialIcons name="close" size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {chatMessages.map((msg, i) => (
                  <View key={i}>
                    <AIChatBubble message={msg} />
                    {msg.suggestions && msg.suggestions.breakdown && (
                      <View style={styles.chatBreakdown}>
                        <CostBreakdownCard items={msg.suggestions.breakdown} />
                      </View>
                    )}
                  </View>
                ))}
                {aiThinking && (
                  <View style={styles.aiThinkingWrap}>
                    <View style={styles.chatAIAvatar}>
                      <MaterialIcons name="auto-awesome" size={14} color="#fff" />
                    </View>
                    <View style={styles.aiThinking}>
                      <View style={styles.thinkingDot} /><View style={[styles.thinkingDot, { animationDelay: '200ms' }]} /><View style={[styles.thinkingDot, { animationDelay: '400ms' }]} />
                    </View>
                  </View>
                )}

                {chatMessages.length === 1 && !aiThinking && (
                  <View style={styles.aiTemplates}>
                    <Text style={styles.aiTemplatesTitle}>Quick-start templates</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiTemplatesScroll}>
                      {PROJECT_TEMPLATES.map((t) => (
                        <ProjectTemplateCard key={t.id} template={t} onApply={() => { applyTemplate(t); closeAI(); }} />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>

              <Animated.View style={[styles.chatInputWrap, { paddingBottom: inputOffset }]}>
                <TextInput style={styles.chatInput} placeholder="Describe your project..." placeholderTextColor={Colors.textMuted} value={chatInput} onChangeText={setChatInput} multiline maxLength={200} />
                <TouchableOpacity style={[styles.chatSendBtn, !chatInput.trim() && styles.chatSendBtnDisabled]} onPress={handleAISend} disabled={!chatInput.trim()} activeOpacity={0.7}>
                  <MaterialIcons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3f0' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 6 },

  /* ─── Header ─── */
  headerWrap: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1, fontWeight: '500' },
  headerAIBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  /* ─── Progress ─── */
  progressWrap: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4, gap: 4 },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', position: 'relative' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#4cdf8b' },
  progressDot: { position: 'absolute', top: -2.5, width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: -5 },
  progressDotActive: { backgroundColor: '#4cdf8b' },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2 },
  stepLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  stepLabelCurrent: { color: '#fff', fontWeight: '700' },
  stepLabelDone: { color: '#4cdf8b' },

  /* ─── Step ─── */
  stepContent: { gap: 10 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.3 },
  stepSub: { fontSize: 13, color: Colors.textLight, marginTop: 1 },
  stepAIHint: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '08', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '15' },
  stepAIHintText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  /* ─── Fields ─── */
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMedium, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  input: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: Colors.textDark, borderWidth: 1, borderColor: Colors.outlineVariant, fontWeight: '500' },
  textArea: { minHeight: 80, paddingTop: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  chipTextActive: { color: '#fff' },

  /* ─── AI Quick Button ─── */
  aiQuickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, marginTop: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  aiQuickBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* ─── Budget ─── */
  budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  budgetCard: { width: (width - 48) / 2 - 4, backgroundColor: Colors.card, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: Colors.outlineVariant },
  budgetCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '06' },
  budgetCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetLabel: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  budgetLabelActive: { color: Colors.primary },
  budgetRange: { fontSize: 12, color: Colors.textLight, fontWeight: '600', marginLeft: 22 },
  budgetSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary + '08', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.primary + '15' },
  budgetSummaryText: { fontSize: 12, fontWeight: '600', color: Colors.primary, flex: 1 },

  /* ─── Selected Count ─── */
  selectedCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '06', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.primary + '12' },
  selectedCountText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  /* ─── Materials ─── */
  matCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  matCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '04' },
  matInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  matCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  matCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  matIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  matInfo: { flex: 1, gap: 2 },
  matName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  matNote: { fontSize: 12, color: Colors.textMedium, padding: 0, marginTop: 2, fontWeight: '500' },

  /* ─── Workers ─── */
  counterChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: Colors.outlineVariant },
  counterLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  counterBtnDisabled: { opacity: 0.5 },
  counterValue: { fontSize: 16, fontWeight: '800', color: Colors.textDark, minWidth: 20, textAlign: 'center' },

  /* ─── Review ─── */
  reviewCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 0, borderWidth: 1, borderColor: Colors.outlineVariant },
  reviewSection: { fontSize: 14, fontWeight: '700', color: Colors.textDark, paddingVertical: 6 },
  reviewDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 5 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  sumIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sumInfo: { flex: 1, gap: 1 },
  sumLabel: { fontSize: 11, fontWeight: '600', color: Colors.textLight },
  sumValue: { fontSize: 13, fontWeight: '700', color: Colors.textDark },

  /* ─── Cost Breakdown ─── */
  breakdownCard: { backgroundColor: Colors.primary + '04', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.primary + '10', marginTop: 8 },
  breakdownTitle: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  breakdownBarWrap: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  breakdownBar: { height: '100%' },
  breakdownLegend: { gap: 6 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { flex: 1, fontSize: 11, fontWeight: '600', color: Colors.textMedium },
  breakdownValue: { fontSize: 11, fontWeight: '700', color: Colors.textDark, minWidth: 60, textAlign: 'right' },
  breakdownPct: { fontSize: 11, fontWeight: '600', color: Colors.textLight, minWidth: 30, textAlign: 'right' },

  /* ─── Apply Banner ─── */
  applyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primary, marginHorizontal: 16, marginTop: 8, borderRadius: 14, padding: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  applyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  applyBannerInfo: { flex: 1 },
  applyBannerTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  applyBannerSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  applyBtn: { backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8 },
  applyBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  /* ─── Bottom Bar ─── */
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.divider, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 6 },
  backStepBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant },
  backStepText: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  nextBtnDisabled: { backgroundColor: Colors.outlineVariant, shadowOpacity: 0 },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* ─── Success ─── */
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successContent: { alignItems: 'center', paddingHorizontal: 36, gap: 8 },
  successIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
  successIconRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  successSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  successMeta: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, width: '100%', gap: 2, alignItems: 'center', marginTop: 8 },
  successMetaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  successMetaValue: { fontSize: 15, fontWeight: '700', color: '#fff' },
  successBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 24, paddingVertical: 13, marginTop: 16 },
  successBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  /* ─── AI Modal ─── */
  aiOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  aiPanel: { backgroundColor: '#f8f7f5', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.85, minHeight: height * 0.5 },
  aiPanelHandle: { alignItems: 'center', paddingTop: 8 },
  aiHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  aiPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  aiPanelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiPanelIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
  aiPanelTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  aiPanelSub: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  aiPanelClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  chatScroll: { flex: 1, maxHeight: height * 0.55 },
  chatContent: { padding: 16, gap: 10 },

  /* ─── Chat Bubbles ─── */
  chatBubbleWrap: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chatUser: { justifyContent: 'flex-end' },
  chatAI: { justifyContent: 'flex-start' },
  chatAIAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 4 },
  chatBubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  chatBubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  chatBubbleAI: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.outlineVariant },
  chatText: { fontSize: 13, color: Colors.textDark, lineHeight: 19 },
  chatTextUser: { color: '#fff' },
  chatBreakdown: { marginLeft: 36, marginBottom: 8 },
  aiThinkingWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  aiThinking: { flexDirection: 'row', gap: 4, backgroundColor: Colors.card, borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.outlineVariant },
  thinkingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textMuted },

  /* ─── Templates ─── */
  aiTemplates: { marginTop: 12, gap: 8 },
  aiTemplatesTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMedium, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiTemplatesScroll: { gap: 10, paddingBottom: 4 },

  templateCard: { width: width * 0.55, backgroundColor: Colors.card, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: Colors.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  templateIcon: { fontSize: 28 },
  templateName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  templateDesc: { fontSize: 11, color: Colors.textLight, lineHeight: 15 },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  templateBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  /* ─── Chat Input ─── */
  chatInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 0, paddingHorizontal: 12, paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.card },
  chatInput: { flex: 1, height: 56, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: Colors.textDark, borderWidth: 1, borderColor: Colors.outlineVariant },
  chatSendBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  chatSendBtnDisabled: { backgroundColor: Colors.outlineVariant, shadowOpacity: 0 },
});
