import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

type Persona = {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  route: string;
};

const PERSONAS: Persona[] = [
  {
    id: 'vendor',
    title: 'Vendor',
    icon: 'store',
    description: 'Sell materials and manage your product listings, inventory, and sales.',
    color: Colors.primaryGreen,
    bgColor: Colors.primaryGreen + '12',
    route: '/vendor-dashboard',
  },
  {
    id: 'worker',
    title: 'Worker',
    icon: 'build',
    description: 'Find jobs, manage your profile, and connect with clients.',
    color: Colors.secondary,
    bgColor: Colors.secondary + '12',
    route: '/worker-dashboard',
  },
  {
    id: 'engineer',
    title: 'Engineer',
    icon: 'engineering',
    description: 'Oversee projects, manage teams, and access technical specs.',
    color: Colors.tertiary,
    bgColor: Colors.tertiary + '12',
    route: '/engineer-dashboard',
  },
  {
    id: 'buyer',
    title: 'Buyer',
    icon: 'shopping-bag',
    description: 'Browse materials, hire workers, and track all your construction projects.',
    color: '#0d631b',
    bgColor: '#e8f5e9',
    route: '/buyer-dashboard',
  },
];

function PersonaCard({
  persona,
  isSelected,
  onPress,
  index,
}: {
  persona: Persona;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.personaCard,
          isSelected && { borderColor: persona.color, borderWidth: 2, backgroundColor: persona.bgColor },
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.personaIcon, { backgroundColor: isSelected ? persona.color + '20' : persona.bgColor }]}>
            <MaterialIcons name={persona.icon as any} size={26} color={persona.color} />
          </View>
          <View style={styles.personaInfo}>
            <Text style={[styles.personaTitle, isSelected && { color: persona.color }]}>
              {persona.title}
            </Text>
            <Text style={styles.personaDescription}>{persona.description}</Text>
          </View>
        </View>
        <View style={[styles.radio, isSelected && { borderColor: persona.color }]}>
          {isSelected && <View style={[styles.radioInner, { backgroundColor: persona.color }]} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PersonaOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedPersona = PERSONAS.find((p) => p.id === selected);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.primary, '#0a5215', Colors.primaryContainer]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.headerContent, { paddingTop: Math.max(insets.top + 16, 56) }]}>
          <View style={styles.headerBadge}>
            <MaterialIcons name="verified" size={14} color={Colors.primary} />
            <Text style={styles.headerBadgeText}>BuildLinka</Text>
          </View>
          <Text style={styles.headerTitle}>Who are you?</Text>
          <Text style={styles.headerSubtitle}>
            Choose your role to unlock a personalized experience
          </Text>
        </View>
        <View style={styles.headerCurve} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {PERSONAS.map((persona, i) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isSelected={selected === persona.id}
            onPress={() => setSelected(persona.id)}
            index={i}
          />
        ))}
      </ScrollView>

      <View style={[styles.bottomArea, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          disabled={!selected}
          onPress={() => selectedPersona && router.push(selectedPersona.route as any)}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueBtnText, !selected && styles.continueBtnTextDisabled]}>
            {selected ? `Continue as ${selectedPersona?.title}` : 'Select a role to continue'}
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={selected ? '#fff' : Colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.push('/(tabs)' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ─── Header ─── */
  headerGradient: {
    paddingTop: 0,
    paddingBottom: 0,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 6,
  },
  headerCurve: {
    height: 24,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textWhite,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },

  /* ─── Scrollable Cards ─── */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    gap: 10,
    paddingBottom: 8,
  },

  /* ─── Persona Card ─── */
  cardWrapper: {
    marginBottom: 0,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  personaIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaInfo: {
    flex: 1,
    gap: 2,
  },
  personaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  personaDescription: {
    fontSize: 12,
    color: Colors.textMedium,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 99,
  },

  /* ─── Bottom ─── */
  bottomArea: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
    backgroundColor: Colors.background,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingVertical: 16,
    width: '100%',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  continueBtnTextDisabled: {
    color: Colors.textMuted,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
  },
});
