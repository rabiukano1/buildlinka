import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const ENGINEER = {
  name: 'Eng. Ibrahim S.',
  title: 'Structural Engineer',
  emoji: '👨‍💼',
  location: 'Abuja, Nigeria',
  experience: 14,
  projectsCompleted: 38,
  rating: 4.9,
  license: 'COREN R. 12478',
};

const ACTIVE_PROJECTS = [
  {
    id: 'pr1',
    name: 'Greenview Estate',
    client: 'Habitat Dev. Corp',
    budget: 120000000,
    spent: 72000000,
    progress: 60,
    status: 'on-track',
    deadline: 'Dec 2026',
    team: 12,
  },
  {
    id: 'pr2',
    name: 'Ikeja Mall Complex',
    client: 'RetailSpace Ltd',
    budget: 85000000,
    spent: 25500000,
    progress: 30,
    status: 'at-risk',
    deadline: 'Mar 2027',
    team: 8,
  },
  {
    id: 'pr3',
    name: 'Lekki Bridge Access Rd',
    client: 'State Gov.',
    budget: 250000000,
    spent: 212500000,
    progress: 85,
    status: 'on-track',
    deadline: 'Aug 2026',
    team: 24,
  },
];

const PROJECT_STATUS: Record<string, { label: string; icon: string; color: string }> = {
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
    <View style={pStyles.barTrack}>
      <Animated.View
        style={[pStyles.barFill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${progress}%`] }) }]}
      />
    </View>
  );
}

const pStyles = StyleSheet.create({
  barTrack: {
    height: 6,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

function AnimatedMetricCard({ value, label, icon, color, delay }: { value: string; label: string; icon: string; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.metricCard, { opacity: anim, transform: [{ scale: anim }] }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function EngineerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.tertiary, '#524000', Colors.tertiaryContainer]}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Engineer Dashboard</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <MaterialIcons name="verified" size={12} color="#ffd54f" />
            <Text style={styles.headerBadgeText}>COREN</Text>
          </View>
        </View>

        <View style={styles.headerProfile}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{ENGINEER.emoji}</Text>
          </View>
          <View style={styles.headerProfileInfo}>
            <Text style={styles.headerName}>{ENGINEER.name}</Text>
            <Text style={styles.headerTitleText}>{ENGINEER.title}</Text>
            <View style={styles.headerMetaRow}>
              <MaterialIcons name="location-on" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.headerMeta}>{ENGINEER.location}</Text>
              <Text style={styles.headerMetaDot}>·</Text>
              <MaterialIcons name="star" size={12} color="#ffd54f" />
              <Text style={styles.headerMeta}>{ENGINEER.rating}</Text>
            </View>
          </View>
          <View style={styles.headerLicenseBox}>
            <Text style={styles.headerLicenseIcon}>📜</Text>
            <Text style={styles.headerLicenseText}>{ENGINEER.license}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.tertiary} colors={[Colors.tertiary, Colors.primary]} progressBackgroundColor="#fff" />
        }
      >
        {/* ─── Metrics Grid ─── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <AnimatedMetricCard value={ENGINEER.projectsCompleted.toString()} label="Projects" icon="business" color={Colors.primary} delay={0} />
          <AnimatedMetricCard value={ENGINEER.experience + 'yr'} label="Experience" icon="trending-up" color={Colors.secondary} delay={100} />
          <AnimatedMetricCard value={ACTIVE_PROJECTS.length.toString()} label="Active" icon="construction" color={Colors.tertiary} delay={200} />
          <AnimatedMetricCard value={(ACTIVE_PROJECTS.reduce((s, p) => s + p.team, 0)).toString()} label="Team Size" icon="groups" color={Colors.info} delay={300} />
        </View>

        {/* ─── Active Projects ─── */}
        <View style={styles.projectsSection}>
          <View style={styles.projectsHeader}>
            <Text style={styles.sectionTitle}>Active Projects</Text>
            <TouchableOpacity onPress={() => router.push('/projects' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {ACTIVE_PROJECTS.map((project) => {
            const status = PROJECT_STATUS[project.status] || PROJECT_STATUS['on-track'];
            return (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectTop}>
                  <View style={styles.projectNameRow}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <View style={[styles.projectStatusBadge, { backgroundColor: status.color + '15' }]}>
                      <MaterialIcons name={status.icon as any} size={12} color={status.color} />
                      <Text style={[styles.projectStatusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.projectClient}>{project.client}</Text>
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
              </View>
            );
          })}
        </View>

        {/* ─── Quick Stats ─── */}
        <View style={styles.quickStatsCard}>
          <View style={styles.quickStatItem}>
            <MaterialIcons name="description" size={22} color={Colors.primary} />
            <Text style={styles.quickStatValue}>24</Text>
            <Text style={styles.quickStatLabel}>Specs</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <MaterialIcons name="fact-check" size={22} color={Colors.secondary} />
            <Text style={styles.quickStatValue}>12</Text>
            <Text style={styles.quickStatLabel}>Inspections</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <MaterialIcons name="calendar-month" size={22} color={Colors.tertiary} />
            <Text style={styles.quickStatValue}>6</Text>
            <Text style={styles.quickStatLabel}>Site Visits</Text>
          </View>
        </View>

        {/* ─── Quick Actions ─── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/projects' as any)}>
            <MaterialIcons name="business" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>My Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/team' as any)}>
            <MaterialIcons name="groups" size={22} color={Colors.secondary} />
            <Text style={styles.quickActionText}>Team</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/specifications' as any)}>
            <MaterialIcons name="description" size={22} color={Colors.warning} />
            <Text style={styles.quickActionText}>Specs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/settings' as any)}>
            <MaterialIcons name="settings" size={22} color={Colors.textMedium} />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    gap: 14,
    paddingTop: 12,
  },

  /* ─── Header ─── */
  headerWrap: {
    paddingBottom: 20,
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
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: 6,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  notifBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffd54f',
  },

  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  headerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 28,
  },
  headerProfileInfo: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  headerMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  headerMetaDot: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  headerLicenseBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerLicenseIcon: {
    fontSize: 14,
  },
  headerLicenseText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffd54f',
    marginTop: 1,
    textAlign: 'center',
  },

  /* ─── Section Title ─── */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },

  /* ─── Metrics Grid ─── */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },

  /* ─── Projects ─── */
  projectsSection: {
    gap: 10,
  },
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },
  projectCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projectTop: {
    gap: 4,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  projectStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  projectStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  projectClient: {
    fontSize: 12,
    color: Colors.textMedium,
  },
  projectBudgetRow: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
    marginBottom: 2,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  budgetValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
  },
  progressArea: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* ─── Quick Stats ─── */
  quickStatsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  quickStatLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: Colors.divider,
  },

  /* ─── Quick Actions ─── */
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
});
