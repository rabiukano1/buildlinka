import { useState, useCallback, useRef, useEffect } from 'react';
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
import { WORKERS } from '../constants/MockData';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const currentWorker = WORKERS[0];

const UPCOMING_JOBS = [
  { id: 'j1', client: 'Mr. Adebayo O.', site: 'Ikeja, Lagos', date: 'Tomorrow, 8:00 AM', status: 'confirmed', type: 'Block Laying' },
  { id: 'j2', client: 'Mrs. Chioma E.', site: 'Surulere, Lagos', date: 'Jun 12, 7:00 AM', status: 'pending', type: 'Plastering' },
  { id: 'j3', client: 'Alh. Musa B.', site: 'Victoria Island', date: 'Jun 15, 9:00 AM', status: 'confirmed', type: 'Rendering' },
];

const EARNINGS_DATA = [
  { label: 'This Week', value: 135000 },
  { label: 'This Month', value: 480000 },
  { label: 'Last Month', value: 395000 },
];

const JOB_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  confirmed: { label: 'Confirmed', icon: 'check-circle', color: Colors.success },
  pending: { label: 'Pending', icon: 'schedule', color: Colors.warning },
  completed: { label: 'Completed', icon: 'check', color: Colors.success },
};

const SKILL_ICONS: Record<string, string> = {
  'Block Laying': '🧱',
  'Plastering': '🏗️',
  'Tiling': '🏛️',
  'Rendering': '🏠',
};

function AnimatedStatCard({ value, label, icon, color, delay }: { value: string; label: string; icon: string; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.statCard, { opacity: anim, transform: [{ scale: anim }] }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function WorkerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const [available, setAvailable] = useState(currentWorker.available);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

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
          <Text style={styles.headerTitle}>My Dashboard</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={[styles.liveDot, { backgroundColor: available ? '#4cdf8b' : Colors.textLight }]} />
            <Text style={styles.liveText}>{available ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        <View style={styles.headerProfile}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{currentWorker.avatar}</Text>
          </View>
          <View style={styles.headerProfileInfo}>
            <Text style={styles.headerName}>{currentWorker.name}</Text>
            <Text style={styles.headerTrade}>{currentWorker.trade}</Text>
            <View style={styles.headerRatingRow}>
              <MaterialIcons name="star" size={13} color="#ffd54f" />
              <Text style={styles.headerRating}>{currentWorker.rating}</Text>
              <Text style={styles.headerReviews}>({currentWorker.reviewCount} reviews)</Text>
              <Text style={styles.headerDot}>·</Text>
              <Text style={styles.headerLocation}>{currentWorker.location}</Text>
            </View>
          </View>
          <View style={styles.headerRateBox}>
            <Text style={styles.headerRateValue}>{formatPrice(currentWorker.dailyRate)}</Text>
            <Text style={styles.headerRateLabel}>/day</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary, Colors.primary]}
            progressBackgroundColor="#fff"
          />
        }
      >
        {/* ─── Availability Toggle ─── */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityLeft}>
            <View style={[styles.availabilityDot, { backgroundColor: available ? Colors.success : Colors.textLight }]} />
            <View>
              <Text style={styles.availabilityLabel}>Availability</Text>
              <Text style={[styles.availabilityStatus, { color: available ? Colors.success : Colors.textLight }]}>
                {available ? 'Available for work' : 'Not available'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.availToggle, available && styles.availToggleActive]}
            onPress={() => setAvailable(!available)}
          >
            <View style={[styles.availKnob, available && styles.availKnobActive]} />
          </TouchableOpacity>
        </View>

        {/* ─── Stats ─── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <AnimatedStatCard value={currentWorker.completedJobs.toString()} label="Jobs Done" icon="work" color={Colors.primary} delay={0} />
          <AnimatedStatCard value={currentWorker.rating.toString()} label="Rating" icon="star" color={Colors.warning} delay={100} />
          <AnimatedStatCard value={currentWorker.experience + 'yr'} label="Experience" icon="trending-up" color={Colors.secondary} delay={200} />
          <AnimatedStatCard value="100%" label="Response" icon="flash-on" color={Colors.tertiary} delay={300} />
        </View>

        {/* ─── Skills ─── */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsRow}>
            {currentWorker.skills.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{SKILL_ICONS[skill] || '🛠️'} {skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Earnings ─── */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <MaterialIcons name="account-balance-wallet" size={18} color={Colors.secondary} />
            <Text style={styles.earningsTitle}>Earnings</Text>
          </View>
          <View style={styles.earningsRow}>
            {EARNINGS_DATA.map((item) => (
              <View key={item.label} style={styles.earningsItem}>
                <Text style={styles.earningsValue}>{formatPrice(item.value)}</Text>
                <Text style={styles.earningsLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Upcoming Jobs ─── */}
        <View style={styles.jobsSection}>
          <View style={styles.jobsHeader}>
            <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/my-jobs' as any)}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {UPCOMING_JOBS.map((job) => {
            const status = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.pending;
            return (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobCardTop}>
                  <View style={[styles.jobStatus, { backgroundColor: status.color + '15' }]}>
                    <MaterialIcons name={status.icon as any} size={12} color={status.color} />
                    <Text style={[styles.jobStatusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.jobType}>{job.type}</Text>
                </View>
                <Text style={styles.jobClient}>{job.client}</Text>
                <View style={styles.jobMeta}>
                  <MaterialIcons name="location-on" size={13} color={Colors.textLight} />
                  <Text style={styles.jobMetaText}>{job.site}</Text>
                </View>
                <View style={styles.jobMeta}>
                  <MaterialIcons name="calendar-today" size={13} color={Colors.textLight} />
                  <Text style={styles.jobMetaText}>{job.date}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Quick Actions ─── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/create-work' as any)}>
            <MaterialIcons name="post-add" size={22} color={Colors.secondary} />
            <Text style={styles.quickActionText}>Create Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/nearby' as any)}>
            <MaterialIcons name="near-me" size={22} color={Colors.secondary} />
            <Text style={styles.quickActionText}>Find Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/edit-profile' as any)}>
            <MaterialIcons name="person" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/my-reviews' as any)}>
            <MaterialIcons name="star" size={22} color={Colors.warning} />
            <Text style={styles.quickActionText}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/team' as any)}>
            <MaterialIcons name="groups" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Team</Text>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
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
  headerTrade: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  headerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  headerRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  headerReviews: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  headerDot: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  headerLocation: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  headerRateBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRateValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  headerRateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  /* ─── Availability ─── */
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  availabilityStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
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

  /* ─── Section Title ─── */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },

  /* ─── Stats Grid ─── */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },

  /* ─── Skills ─── */
  skillsSection: {
    gap: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colors.secondary + '12',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },

  /* ─── Earnings ─── */
  earningsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  earningsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  earningsItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.secondary,
  },
  earningsLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '500',
  },

  /* ─── Jobs Section ─── */
  jobsSection: {
    gap: 10,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  jobCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  jobStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  jobType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  jobClient: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobMetaText: {
    fontSize: 11,
    color: Colors.textLight,
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
