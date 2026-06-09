import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';
import { useFeatured } from '../contexts/FeaturedContext';
import { VENDORS, WORKERS, type Vendor, type Worker } from '../constants/MockData';

const { width } = Dimensions.get('window');

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

type AdminTab = 'overview' | 'featured' | 'push' | 'system';

const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'featured', label: 'Featured', icon: 'stars' },
  { key: 'push', label: 'Push', icon: 'campaign' },
  { key: 'system', label: 'System', icon: 'shield' },
];

function StatCard({ label, value, icon, color, index }: { label: string; value: string; icon: string; color: string; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: 100 + index * 80, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function FeaturedRow({ id, name, emoji, category, isPopular, onToggle }: { id: string; name: string; emoji: string; category: string; isPopular: boolean; onToggle: () => void }) {
  return (
    <View style={styles.featuredRow}>
      <View style={styles.featuredAvatar}>
        <Text style={styles.featuredEmoji}>{emoji}</Text>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName}>{name}</Text>
        <Text style={styles.featuredCat}>{category}</Text>
      </View>
      <View style={[styles.popularBadge, isPopular && styles.popularBadgeActive]}>
        <MaterialIcons name={isPopular ? 'star' : 'star-outline'} size={16} color={isPopular ? '#f59e0b' : Colors.textMuted} />
        <Text style={[styles.popularBadgeText, isPopular && styles.popularBadgeTextActive]}>{isPopular ? 'Popular' : 'Set Popular'}</Text>
      </View>
      <Switch
        value={isPopular}
        onValueChange={onToggle}
        trackColor={{ false: Colors.outlineVariant, true: '#f59e0b60' }}
        thumbColor={isPopular ? '#f59e0b' : Colors.textLight}
      />
    </View>
  );
}

function SysToggle({ label, desc, icon, color, defaultVal }: { label: string; desc: string; icon: string; color: string; defaultVal?: boolean }) {
  const [value, setValue] = useState(defaultVal ?? false);
  return (
    <View style={styles.sysRow}>
      <View style={[styles.sysIcon, { backgroundColor: color + '10' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.sysInfo}>
        <Text style={styles.sysLabel}>{label}</Text>
        <Text style={styles.sysDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={setValue}
        trackColor={{ false: Colors.outlineVariant, true: color + '60' }}
        thumbColor={value ? color : Colors.textLight}
      />
    </View>
  );
}

export default function AdminPanelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount, addNotification } = useNotifications();
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushAudience, setPushAudience] = useState<'all' | 'vendors' | 'workers' | 'engineers' | 'buyers'>('all');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { popularVendorIds, popularWorkerIds, toggleVendorPopular, toggleWorkerPopular } = useFeatured();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.2 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSub}>Full platform control</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={18} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <View style={styles.lockBadge}>
            <MaterialIcons name="admin-panel-settings" size={16} color="#4cdf8b" />
            <Text style={styles.lockText}>Secured</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total Users" value="1,284" icon="people" color="#60a5fa" index={0} />
          <StatCard label="Products" value="892" icon="inventory-2" color="#a78bfa" index={1} />
          <StatCard label="Orders" value="357" icon="receipt-long" color="#22d3ee" index={2} />
          <StatCard label="Revenue" value="₦4.2M" icon="trending-up" color="#34d399" index={3} />
        </View>

      </LinearGradient>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAwareWrapper
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        key={activeTab}
      >
        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <>
            <Text style={styles.mgmtLabel}>Platform Summary</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.ovCard}>
                <View style={[styles.ovIcon, { backgroundColor: '#2563eb15' }]}>
                  <MaterialIcons name="people" size={22} color="#2563eb" />
                </View>
                <Text style={styles.ovValue}>1,284</Text>
                <Text style={styles.ovLabel}>Total Users</Text>
                <View style={styles.ovSubRow}>
                  <Text style={styles.ovSub}>256 Workers</Text>
                  <Text style={styles.ovDot}>·</Text>
                  <Text style={styles.ovSub}>184 Vendors</Text>
                </View>
              </View>
              <View style={styles.ovCard}>
                <View style={[styles.ovIcon, { backgroundColor: '#7c3aed15' }]}>
                  <MaterialIcons name="inventory-2" size={22} color="#7c3aed" />
                </View>
                <Text style={styles.ovValue}>892</Text>
                <Text style={styles.ovLabel}>Products</Text>
                <View style={styles.ovSubRow}>
                  <Text style={styles.ovSub}>24 pending</Text>
                  <Text style={styles.ovDot}>·</Text>
                  <Text style={styles.ovSub}>8 flagged</Text>
                </View>
              </View>
              <View style={styles.ovCard}>
                <View style={[styles.ovIcon, { backgroundColor: '#0891b215' }]}>
                  <MaterialIcons name="receipt-long" size={22} color="#0891b2" />
                </View>
                <Text style={styles.ovValue}>357</Text>
                <Text style={styles.ovLabel}>Orders</Text>
                <View style={styles.ovSubRow}>
                  <Text style={styles.ovSub}>45 pending</Text>
                  <Text style={styles.ovDot}>·</Text>
                  <Text style={styles.ovSub}>3 disputes</Text>
                </View>
              </View>
              <View style={styles.ovCard}>
                <View style={[styles.ovIcon, { backgroundColor: '#05966915' }]}>
                  <MaterialIcons name="trending-up" size={22} color="#059669" />
                </View>
                <Text style={styles.ovValue}>₦4.2M</Text>
                <Text style={styles.ovLabel}>Revenue</Text>
                <View style={styles.ovSubRow}>
                  <Text style={styles.ovSub}>+12% this month</Text>
                </View>
              </View>
            </View>

            <Text style={styles.mgmtLabel}>Quick Actions</Text>
            <View style={styles.quickActionRow}>
              <TouchableOpacity style={styles.qaCard} activeOpacity={0.7}>
                <MaterialIcons name="refresh" size={20} color={Colors.textLight} />
                <Text style={styles.qaCardLabel}>Sync Data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaCard} activeOpacity={0.7}>
                <MaterialIcons name="download" size={20} color={Colors.textLight} />
                <Text style={styles.qaCardLabel}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaCard} activeOpacity={0.7}>
                <MaterialIcons name="report" size={20} color={Colors.textLight} />
                <Text style={styles.qaCardLabel}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qaCard, { backgroundColor: Colors.error + '08' }]} activeOpacity={0.7}>
                <MaterialIcons name="lock" size={20} color={Colors.error} />
                <Text style={[styles.qaCardLabel, { color: Colors.error }]}>Lock Panel</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.mgmtLabel}>Recent Activity</Text>
            <View style={styles.activityCard}>
              {[
                { icon: 'person-add', color: '#2563eb', text: '3 new workers registered', time: '12m ago' },
                { icon: 'shopping-cart', color: '#7c3aed', text: '15 new orders placed', time: '34m ago' },
                { icon: 'flag', color: '#dc2626', text: '2 items flagged for review', time: '1h ago' },
                { icon: 'check-circle', color: '#059669', text: '8 products approved', time: '2h ago' },
              ].map((a, i) => (
                <View key={i} style={[styles.activityRow, i < 3 && styles.activityRowBorder]}>
                  <View style={[styles.activityIcon, { backgroundColor: a.color + '10' }]}>
                    <MaterialIcons name={a.icon as any} size={16} color={a.color} />
                  </View>
                  <Text style={styles.activityText}>{a.text}</Text>
                  <Text style={styles.activityTime}>{a.time}</Text>
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>BuildLinka Admin v2.0.1</Text>
              <Text style={styles.footerSub}>Authorized access only</Text>
            </View>
          </>
        )}

        {/* ─── FEATURED CONTENT ─── */}
        {activeTab === 'featured' && (
          <>
            <Text style={styles.mgmtLabel}>Vendors ({VENDORS.filter(v => popularVendorIds.includes(v.id)).length} popular)</Text>
            <View style={styles.featuredCard}>
              {VENDORS.map((v, i) => (
                <View key={v.id}>
                  <FeaturedRow
                    id={v.id}
                    name={v.name}
                    emoji={v.emoji}
                    category={v.category}
                    isPopular={popularVendorIds.includes(v.id)}
                    onToggle={() => toggleVendorPopular(v.id)}
                  />
                  {i < VENDORS.length - 1 && <View style={styles.featuredDivider} />}
                </View>
              ))}
            </View>

            <Text style={styles.mgmtLabel}>Workers ({WORKERS.filter(w => popularWorkerIds.includes(w.id)).length} popular)</Text>
            <View style={styles.featuredCard}>
              {WORKERS.map((w, i) => (
                <View key={w.id}>
                  <FeaturedRow
                    id={w.id}
                    name={w.name}
                    emoji={w.avatar}
                    category={w.trade}
                    isPopular={popularWorkerIds.includes(w.id)}
                    onToggle={() => toggleWorkerPopular(w.id)}
                  />
                  {i < WORKERS.length - 1 && <View style={styles.featuredDivider} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── PUSH NOTIFICATIONS ─── */}
        {activeTab === 'push' && (
          <>
            <Text style={styles.mgmtLabel}>Compose Push Notification</Text>
            <View style={styles.pushCard}>
              <View style={styles.pushField}>
                <Text style={styles.pushFieldLabel}>AUDIENCE</Text>
                <View style={styles.pushAudienceRow}>
                  {([
                    { key: 'all', label: 'All Users', icon: 'people' },
                    { key: 'vendors', label: 'Vendors', icon: 'store' },
                    { key: 'workers', label: 'Workers', icon: 'handyman' },
                    { key: 'engineers', label: 'Engineers', icon: 'engineering' },
                    { key: 'buyers', label: 'Buyers', icon: 'person' },
                  ] as const).map((a) => (
                    <TouchableOpacity
                      key={a.key}
                      style={[styles.pushAudienceChip, pushAudience === a.key && styles.pushAudienceChipActive]}
                      onPress={() => setPushAudience(a.key)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name={a.icon as any} size={14} color={pushAudience === a.key ? '#fff' : Colors.textLight} />
                      <Text style={[styles.pushAudienceText, pushAudience === a.key && styles.pushAudienceTextActive]}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.pushField}>
                <Text style={styles.pushFieldLabel}>TITLE</Text>
                <TextInput
                  style={styles.pushInput}
                  placeholder="e.g. New Stock Arrival"
                  placeholderTextColor={Colors.textMuted}
                  value={pushTitle}
                  onChangeText={setPushTitle}
                />
              </View>

              <View style={styles.pushField}>
                <Text style={styles.pushFieldLabel}>MESSAGE</Text>
                <TextInput
                  style={[styles.pushInput, styles.pushInputMultiline]}
                  placeholder="Write your notification message..."
                  placeholderTextColor={Colors.textMuted}
                  value={pushMessage}
                  onChangeText={setPushMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.pushSendBtn, (!pushTitle.trim() || !pushMessage.trim() || sending) && styles.pushSendBtnDisabled]}
                onPress={() => {
                  if (!pushTitle.trim() || !pushMessage.trim()) return;
                  setSending(true);
                  const audienceLabel = pushAudience === 'all' ? 'All Users' : pushAudience.charAt(0).toUpperCase() + pushAudience.slice(1);
                  addNotification({
                    type: 'system',
                    title: pushTitle.trim(),
                    message: pushMessage.trim() + `\n\n— Admin (sent to ${audienceLabel})`,
                    timestamp: 'Just now',
                    icon: 'campaign',
                    actionRoute: '/admin-panel',
                  });
                  setTimeout(() => {
                    setSending(false);
                    setPushTitle('');
                    setPushMessage('');
                    setPushAudience('all');
                    Alert.alert('Notification Sent', `Push notification sent to ${audienceLabel}.`);
                  }, 600);
                }}
                disabled={!pushTitle.trim() || !pushMessage.trim() || sending}
                activeOpacity={0.7}
              >
                <MaterialIcons name={sending ? 'hourglass-top' : 'send'} size={18} color="#fff" />
                <Text style={styles.pushSendText}>{sending ? 'Sending...' : 'Send Notification'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── SYSTEM ─── */}
        {activeTab === 'system' && (
          <>
            <Text style={styles.mgmtLabel}>Platform Settings</Text>
            <View style={styles.sysCard}>
              <SysToggle label="Maintenance Mode" desc="Disable user access during updates" icon="construction" color="#dc2626" />
              <View style={styles.sysDivider} />
              <SysToggle label="New Registration" desc="Allow new user sign-ups" icon="person-add" color="#2563eb" defaultVal />
              <View style={styles.sysDivider} />
              <SysToggle label="Verification Required" desc="Require vendor/worker verification" icon="verified" color="#7c3aed" defaultVal />
              <View style={styles.sysDivider} />
              <SysToggle label="Auto-Approve Listings" desc="Skip manual approval for verified sellers" icon="check-circle" color="#059669" />
              <View style={styles.sysDivider} />
              <SysToggle label="Email Notifications" desc="Send email alerts for orders and reports" icon="email" color="#0891b2" defaultVal />
              <View style={styles.sysDivider} />
              <SysToggle label="Analytics Tracking" desc="Collect platform usage analytics" icon="analytics" color="#d97706" defaultVal />
            </View>

            <Text style={styles.mgmtLabel}>Security</Text>
            <View style={styles.sysCard}>
              <View style={styles.sysSecRow}>
                <View style={[styles.sysIcon, { backgroundColor: '#dc262610' }]}>
                  <MaterialIcons name="key" size={18} color="#dc2626" />
                </View>
                <View style={styles.sysInfo}>
                  <Text style={styles.sysLabel}>Admin PIN</Text>
                  <Text style={styles.sysDesc}>Change your 4-digit admin passcode</Text>
                </View>
                <TouchableOpacity style={styles.sysChangeBtn} activeOpacity={0.7}>
                  <Text style={styles.sysChangeText}>Change</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sysDivider} />
              <View style={styles.sysSecRow}>
                <View style={[styles.sysIcon, { backgroundColor: '#2563eb10' }]}>
                  <MaterialIcons name="devices" size={18} color="#2563eb" />
                </View>
                <View style={styles.sysInfo}>
                  <Text style={styles.sysLabel}>Session Management</Text>
                  <Text style={styles.sysDesc}>2 active sessions · Manage devices</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
              <MaterialIcons name="lock-outline" size={18} color={Colors.error} />
              <Text style={styles.logoutText}>Lock Admin Panel</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>BuildLinka Admin v2.0.1</Text>
              <Text style={styles.footerSub}>Authorized access only</Text>
            </View>
          </>
        )}
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  /* ─── Header ─── */
  headerWrap: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    borderColor: 'rgba(255,255,255,0.15)',
  },
  notifBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontWeight: '500' },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  lockText: { fontSize: 11, fontWeight: '700', color: '#4cdf8b' },

  /* ─── Stats ─── */
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  /* ─── Tab Bar ─── */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.primary + '10',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  /* ─── Section Label ─── */
  mgmtLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginLeft: 4, marginTop: 4,
  },

  /* ─── Overview Grid ─── */
  overviewGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  ovCard: {
    width: (width - 40) / 2,
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  ovIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ovValue: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  ovLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600' },
  ovSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  ovSub: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  ovDot: { fontSize: 10, color: Colors.textMuted },

  /* ─── Quick Actions ─── */
  quickActionRow: {
    flexDirection: 'row', gap: 8,
  },
  qaCard: {
    flex: 1, alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  qaCardLabel: { fontSize: 10, fontWeight: '700', color: Colors.textLight },

  /* ─── Activity Card ─── */
  activityCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  activityRowBorder: {
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '60',
  },
  activityIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.textDark },
  activityTime: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },

  /* ─── Featured Card ─── */
  featuredCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  featuredRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  featuredAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '08',
    alignItems: 'center', justifyContent: 'center',
  },
  featuredEmoji: { fontSize: 16 },
  featuredInfo: { flex: 1 },
  featuredName: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  featuredCat: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  popularBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, backgroundColor: Colors.outlineVariant + '40',
  },
  popularBadgeActive: { backgroundColor: '#f59e0b15' },
  popularBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.textMuted },
  popularBadgeTextActive: { color: '#f59e0b' },
  featuredDivider: {
    height: 1, backgroundColor: Colors.outlineVariant + '60',
    marginLeft: 60,
  },

  /* ─── Push Card (inline in tab) ─── */
  pushCard: {
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    padding: 16, gap: 16,
  },
  pushField: { gap: 6 },
  pushFieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMedium, letterSpacing: 0.6 },
  pushAudienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pushAudienceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  pushAudienceChipActive: { backgroundColor: '#d97706', borderColor: '#d97706' },
  pushAudienceText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  pushAudienceTextActive: { color: '#fff' },
  pushInput: {
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.textDark,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    fontWeight: '500',
  },
  pushInputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  pushSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#d97706', borderRadius: 14,
    paddingVertical: 14, marginTop: 4,
    shadowColor: '#d97706', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  pushSendBtnDisabled: { opacity: 0.5 },
  pushSendText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* ─── System ─── */
  sysCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  sysRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    gap: 12,
  },
  sysSecRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    gap: 12,
  },
  sysIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sysInfo: { flex: 1 },
  sysLabel: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  sysDesc: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  sysDivider: { height: 1, backgroundColor: Colors.outlineVariant + '60', marginLeft: 60 },
  sysChangeBtn: {
    backgroundColor: Colors.primary + '10', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  sysChangeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  /* ─── Logout ─── */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
    borderColor: Colors.error + '30',
    backgroundColor: Colors.error + '08',
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: Colors.error },

  /* ─── Footer ─── */
  footer: { alignItems: 'center', paddingVertical: 20, gap: 2 },
  footerText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  footerSub: { fontSize: 10, color: Colors.textMuted },
});
