import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { WORKERS } from '../constants/MockData';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';

const TEAM_MEMBERS = [
  {
    id: 'tm1',
    name: 'Eng. Ibrahim S.',
    role: 'Structural Engineer',
    avatar: '👨‍💼',
    status: 'active',
    project: 'Greenview Estate',
    email: 'ibrahim.s@buildlinka.com',
    phone: '+234 802 345 6789',
  },
  {
    id: 'tm2',
    name: 'Emeka Okafor',
    role: 'Master Mason',
    avatar: '👷',
    status: 'active',
    project: 'Ikeja Mall Complex',
    email: 'emeka.o@buildlinka.com',
    phone: '+234 803 456 7890',
  },
  {
    id: 'tm3',
    name: 'Eng. Amina Bello',
    role: 'Civil Engineer',
    avatar: '👩‍💼',
    status: 'active',
    project: 'Lekki Bridge Rd',
    email: 'amina.b@buildlinka.com',
    phone: '+234 805 678 9012',
  },
  {
    id: 'tm4',
    name: 'Bello Adamu',
    role: 'Electrician',
    avatar: '⚡',
    status: 'on-site',
    project: 'Greenview Estate',
    email: 'bello.a@buildlinka.com',
    phone: '+234 806 789 0123',
  },
  {
    id: 'tm5',
    name: 'Eng. Segun O.',
    role: 'Project Manager',
    avatar: '👨‍💻',
    status: 'active',
    project: 'All Projects',
    email: 'segun.o@buildlinka.com',
    phone: '+234 807 890 1234',
  },
  {
    id: 'tm6',
    name: 'Chukwudi Eze',
    role: 'Plumber',
    avatar: '🔧',
    status: 'idle',
    project: 'Ikeja Mall Complex',
    email: 'chukwudi.e@buildlinka.com',
    phone: '+234 808 901 2345',
  },
  {
    id: 'tm7',
    name: 'Aminu Garba',
    role: 'Carpenter',
    avatar: '🪚',
    status: 'active',
    project: 'Lekki Bridge Rd',
    email: 'aminu.g@buildlinka.com',
    phone: '+234 809 012 3456',
  },
  {
    id: 'tm8',
    name: 'Eng. Funmi A.',
    role: 'Site Supervisor',
    avatar: '👩‍🏗️',
    status: 'on-site',
    project: 'Greenview Estate',
    email: 'funmi.a@buildlinka.com',
    phone: '+234 810 123 4567',
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: Colors.success },
  'on-site': { label: 'On Site', color: Colors.primary },
  idle: { label: 'Idle', color: Colors.textLight },
};

function MemberCard({ member, index }: { member: typeof TEAM_MEMBERS[0]; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const status = STATUS_CONFIG[member.status] || STATUS_CONFIG.idle;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.memberCard, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={styles.memberAvatarWrap}>
        <Text style={styles.memberAvatar}>{member.avatar}</Text>
        <View style={[styles.memberStatusDot, { backgroundColor: status.color }]} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
        <View style={styles.memberMeta}>
          <View style={[styles.memberStatusBadge, { backgroundColor: status.color + '15' }]}>
            <View style={[styles.memberStatusDotSmall, { backgroundColor: status.color }]} />
            <Text style={[styles.memberStatusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.memberProject}>{member.project}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.memberCallBtn}>
        <MaterialIcons name="phone" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TeamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = TEAM_MEMBERS.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  const activeCount = TEAM_MEMBERS.filter((m) => m.status === 'active' || m.status === 'on-site').length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.primary, '#0a5215', Colors.primaryContainer]}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Team</Text>
          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>{TEAM_MEMBERS.length}</Text>
          </View>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{TEAM_MEMBERS.length}</Text>
            <Text style={styles.headerStatLabel}>Total</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatValue, { color: '#4cdf8b' }]}>{activeCount}</Text>
            <Text style={styles.headerStatLabel}>Active</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{TEAM_MEMBERS.filter((m) => m.status === 'idle').length}</Text>
            <Text style={styles.headerStatLabel}>Idle</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{TEAM_MEMBERS.filter((m) => m.role.includes('Engineer')).length}</Text>
            <Text style={styles.headerStatLabel}>Engineers</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or role..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAwareWrapper
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((member, i) => (
          <MemberCard key={member.id} member={member} index={i} />
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        )}
      </KeyboardAwareWrapper>
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
    gap: 10,
    paddingTop: 8,
  },

  /* ─── Header ─── */
  headerWrap: {
    paddingBottom: 16,
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
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  headerStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  headerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  /* ─── Search ─── */
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textDark,
    padding: 0,
  },

  /* ─── Member Card ─── */
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  memberAvatarWrap: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatar: {
    fontSize: 22,
  },
  memberStatusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  memberRole: {
    fontSize: 12,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memberStatusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memberStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberProject: {
    fontSize: 10,
    color: Colors.textLight,
  },
  memberCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ─── Empty ─── */
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
