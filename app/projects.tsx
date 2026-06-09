import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const PROJECTS = [
  {
    id: 'pr1',
    name: 'Greenview Estate',
    client: 'Habitat Dev. Corp',
    budget: 120000000,
    spent: 72000000,
    progress: 60,
    status: 'on-track' as const,
    deadline: 'Dec 2026',
    team: 12,
    location: 'Lekki, Lagos',
  },
  {
    id: 'pr2',
    name: 'Ikeja Mall Complex',
    client: 'RetailSpace Ltd',
    budget: 85000000,
    spent: 25500000,
    progress: 30,
    status: 'at-risk' as const,
    deadline: 'Mar 2027',
    team: 8,
    location: 'Ikeja, Lagos',
  },
  {
    id: 'pr3',
    name: 'Lekki Bridge Access Rd',
    client: 'State Gov.',
    budget: 250000000,
    spent: 212500000,
    progress: 85,
    status: 'on-track' as const,
    deadline: 'Aug 2026',
    team: 24,
    location: 'Lekki, Lagos',
  },
  {
    id: 'pr4',
    name: 'Abuja Mall Renovation',
    client: 'Prime Properties',
    budget: 45000000,
    spent: 33750000,
    progress: 75,
    status: 'delayed' as const,
    deadline: 'Sep 2026',
    team: 10,
    location: 'Abuja, FCT',
  },
];

const STATUS_META: Record<string, { label: string; icon: string; color: string }> = {
  'on-track': { label: 'On Track', icon: 'check-circle', color: Colors.success },
  'at-risk': { label: 'At Risk', icon: 'warning', color: Colors.error },
  delayed: { label: 'Delayed', icon: 'schedule', color: Colors.warning },
};

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={{ height: 6, backgroundColor: Colors.surfaceVariant, borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', backgroundColor: color, borderRadius: 3, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${progress}%`] }) }} />
    </View>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.tertiary, '#524000', Colors.tertiaryContainer]}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>My Projects</Text>
            <Text style={styles.headerSub}>{PROJECTS.length} active projects</Text>
          </View>
          <MaterialIcons name="business" size={22} color="rgba(255,255,255,0.5)" />
        </View>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{formatPrice(totalBudget)}</Text>
            <Text style={styles.headerStatLabel}>Total Budget</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{formatPrice(totalSpent)}</Text>
            <Text style={styles.headerStatLabel}>Total Spent</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.tertiary} colors={[Colors.tertiary]} progressBackgroundColor="#fff" />
        }
      >
        {PROJECTS.map((project) => {
          const status = STATUS_META[project.status];
          return (
            <TouchableOpacity key={project.id} style={styles.projectCard} activeOpacity={0.7} onPress={() => {}}>
              <View style={styles.projectTop}>
                <View style={styles.projectNameRow}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                    <MaterialIcons name={status.icon as any} size={12} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.projectClient}>{project.client}</Text>
                <View style={styles.projectMeta}>
                  <MaterialIcons name="location-on" size={11} color={Colors.textLight} />
                  <Text style={styles.projectMetaText}>{project.location}</Text>
                  <Text style={styles.projectMetaDot}>·</Text>
                  <MaterialIcons name="people" size={11} color={Colors.textLight} />
                  <Text style={styles.projectMetaText}>{project.team}</Text>
                </View>
              </View>
              <View style={styles.projectBudgetRow}>
                <View>
                  <Text style={styles.budgetLabel}>Budget</Text>
                  <Text style={styles.budgetValue}>{formatPrice(project.budget)}</Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>Spent</Text>
                  <Text style={[styles.budgetValue, { color: Colors.secondary }]}>{formatPrice(project.spent)}</Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>Deadline</Text>
                  <Text style={styles.budgetValueSmall}>{project.deadline}</Text>
                </View>
              </View>
              <View style={styles.progressArea}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={[styles.progressPct, { color: status.color }]}>{project.progress}%</Text>
                </View>
                <ProgressBar progress={project.progress} color={status.color} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  headerStats: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14 },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8 },

  content: { padding: 16, gap: 10 },

  projectCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 12, borderLeftWidth: 3, borderLeftColor: Colors.tertiary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  projectTop: { gap: 4 },
  projectNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  projectName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  projectClient: { fontSize: 12, color: Colors.textMedium },
  projectMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  projectMetaText: { fontSize: 11, color: Colors.textLight },
  projectMetaDot: { fontSize: 14, color: Colors.textMuted },

  projectBudgetRow: { flexDirection: 'row', gap: 16 },
  budgetLabel: { fontSize: 10, color: Colors.textLight, fontWeight: '500', marginBottom: 2 },
  budgetValue: { fontSize: 14, fontWeight: '800', color: Colors.textDark },
  budgetValueSmall: { fontSize: 12, fontWeight: '600', color: Colors.textDark },

  progressArea: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  progressPct: { fontSize: 12, fontWeight: '700' },
});
