import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ROLE_HOME, type Role } from '../../lib/backend';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import { useLocation } from '../../hooks/useLocation';

type MenuItem = {
  icon: string;
  label: string;
  color: string;
  badge?: string;
};

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Orders',
    items: [
      { icon: 'shopping-bag', label: 'My Orders', color: Colors.primaryGreen },
      { icon: 'bookmark', label: 'Saved Items', color: Colors.primaryOrange },
      { icon: 'history', label: 'Order History', color: Colors.info },
    ],
  },
  {
    title: 'Listing',
    items: [
      { icon: 'storefront', label: 'My Listings', color: Colors.primaryGreen },
      { icon: 'add-circle', label: 'Add New Listing', color: Colors.primaryOrange },
      { icon: 'star', label: 'My Reviews', color: Colors.amber },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: 'settings', label: 'Settings', color: Colors.textMuted },
    ],
  },
];

const RECENT_ACTIVITY: { icon: string; label: string; time: string; color: string }[] = [];

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me);
  const myOrders = useQuery(api.orders.mine, me ? {} : 'skip');
  const recentOrders = (myOrders ?? []).slice(0, 3);
  const setRole = useMutation(api.users.setRole);
  const [switching, setSwitching] = useState(false);

  const ROLE_META: { role: Role; label: string; icon: string }[] = [
    { role: 'buyer', label: 'Buyer', icon: 'shopping-bag' },
    { role: 'vendor', label: 'Vendor', icon: 'storefront' },
    { role: 'worker', label: 'Worker', icon: 'build' },
    { role: 'engineer', label: 'Engineer', icon: 'engineering' },
    ...(me?.roles.includes('admin') ? [{ role: 'admin' as Role, label: 'Admin', icon: 'shield' }] : []),
  ];

  const switchRole = async (role: Role) => {
    if (role === me?.activeRole || switching) return;
    // Admins open the panel directly; the admin role itself is granted, never picked.
    if (role === 'admin') {
      router.replace('/admin-panel' as any);
      return;
    }
    // Vendors need a store before the vendor dashboard makes sense.
    if (role === 'vendor' && !me?.store) {
      router.push('/create-store' as any);
      return;
    }
    setSwitching(true);
    try {
      await setRole({ role });
      router.replace((ROLE_HOME[role] ?? '/(tabs)') as any);
    } catch {
      Alert.alert('Could not switch role', 'Please try again.');
    } finally {
      setSwitching(false);
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { pickAvatar } = useMediaPicker();
  const { address, loading: locLoading, permission: locPermission, refresh: refreshLocation } = useLocation();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleAvatarPress = useCallback(async () => {
    const uri = await pickAvatar();
    if (uri) setAvatarUri(uri);
  }, [pickAvatar]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryGreen} />
      }
    >
      {/* ─── Profile header ─── */}
      <LinearGradient
        colors={[Colors.primaryGreen, Colors.darkGreen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.headerRow}>
          <View />
          <TouchableOpacity style={styles.settingsBtn}>
            <MaterialIcons name="settings" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
          <TouchableOpacity style={styles.avatarSection} onPress={handleAvatarPress} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {avatarUri ? (
                  <Image source={avatarUri} style={styles.avatarImage} contentFit="cover" priority="high" />
                ) : (
                  <Text style={styles.avatarEmoji}>👤</Text>
                )}
              </View>
              <View style={styles.avatarEditBadge}>
                <MaterialIcons name="camera-alt" size={12} color={Colors.textWhite} />
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={18} color={Colors.amber} />
              </View>
            </View>
            <Text style={styles.profileName}>{me?.name || 'Your profile'}</Text>
            <Text style={styles.profileEmail}>{me?.phone || me?.email || 'Sign in to see your details'}</Text>
            <View style={styles.profileMeta}>
              <MaterialIcons name="location-on" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={styles.profileLocation}>
                {locLoading ? 'Locating...' : address || (locPermission === 'denied' ? 'Location off' : 'Lagos, Nigeria')}
              </Text>
            </View>
          </TouchableOpacity>
      </LinearGradient>

      {/* ─── Stats row ─── */}
      <FadeInSection delay={80}>
        <View style={styles.statsCard}>
          {[
            { number: String(me?.roles.length ?? 0), label: 'Roles', color: Colors.primaryGreen },
            { number: me?.store ? '1' : '0', label: 'Stores', color: Colors.primaryOrange },
            { number: me?.activeRole ? me.activeRole[0].toUpperCase() + me.activeRole.slice(1) : '—', label: 'Role', color: Colors.amber },
            { number: me ? String(new Date(me.joinedAt).getFullYear()) : '—', label: 'Since', color: Colors.primaryGreen },
          ].map((stat, i) => (
            <TouchableOpacity
              key={stat.label}
              style={styles.statItem}
              onPress={() => stat.label === 'Orders' ? router.push('/orders') : undefined}
            >
              <Text style={[styles.statNumber, { color: stat.color }]}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FadeInSection>

      {/* ─── Referral card ─── */}
      <FadeInSection delay={160}>
        <LinearGradient
          colors={[Colors.secondary, Colors.secondaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.referralCard}
        >
          <View style={styles.referralContent}>
            <View style={styles.referralTextCol}>
              <Text style={styles.referralTitle}>Refer a Friend</Text>
              <Text style={styles.referralSub}>Get ₦2,000 off your next order</Text>
            </View>
            <TouchableOpacity style={styles.referralBtn}>
              <MaterialIcons name="share" size={16} color={Colors.secondary} />
              <Text style={styles.referralBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </FadeInSection>

      {/* ─── Recent Activity — real orders, newest first ─── */}
      <FadeInSection delay={240}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {myOrders === undefined ? (
              <View style={styles.activityRow}>
                <ActivityIndicator size="small" color={Colors.primaryGreen} />
              </View>
            ) : recentOrders.length === 0 ? (
              <View style={styles.activityRow}>
                <View style={[styles.activityIconBox, { backgroundColor: Colors.primaryGreen + '18' }]}>
                  <MaterialIcons name="shopping-bag" size={18} color={Colors.primaryGreen} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel} numberOfLines={1}>No orders yet</Text>
                  <Text style={styles.activityTime}>Your orders will appear here</Text>
                </View>
              </View>
            ) : (
              recentOrders.map((o, i) => (
                <View
                  key={o._id}
                  style={[styles.activityRow, i < recentOrders.length - 1 && styles.activityRowBorder]}
                >
                  <View style={[styles.activityIconBox, { backgroundColor: Colors.primaryGreen + '18' }]}>
                    <MaterialIcons name="shopping-cart" size={18} color={Colors.primaryGreen} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityLabel} numberOfLines={1}>
                      Order {o.number} · {o.status}
                    </Text>
                    <Text style={styles.activityTime}>{o.storeName}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={Colors.border} />
                </View>
              ))
            )}
            {RECENT_ACTIVITY.map((a, i) => (
              <View
                key={'legacy-' + i}
                style={[styles.activityRow, styles.activityRowBorder]}
              >
                <View style={[styles.activityIconBox, { backgroundColor: a.color + '18' }]}>
                  <MaterialIcons name={a.icon as any} size={18} color={a.color} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel} numberOfLines={1}>{a.label}</Text>
                  <Text style={styles.activityTime}>{a.time}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={Colors.border} />
              </View>
            ))}
          </View>
        </View>
      </FadeInSection>

      {/* ─── My roles — switch type or add a new one ─── */}
      <FadeInSection delay={280}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>My roles</Text>
          <Text style={styles.roleHint}>
            {me
              ? `Using BuildLinka as ${me.activeRole ? me.activeRole[0].toUpperCase() + me.activeRole.slice(1) : 'a new member'}. One account, every type — switch any time.`
              : 'Sign in to see your roles.'}
          </Text>
          <View style={styles.roleGrid}>
            {ROLE_META.filter((r) => r.role === me?.activeRole || me?.roles.includes(r.role)).map((r) => {
              const active = r.role === me?.activeRole;
              return (
                <TouchableOpacity
                  key={r.role}
                  style={[styles.roleChip, active && styles.roleChipActive]}
                  onPress={() => switchRole(r.role)}
                  disabled={active || switching}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={r.icon as never}
                    size={18}
                    color={active ? Colors.textWhite : Colors.primaryGreen}
                  />
                  <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{r.label}</Text>
                  {active && <MaterialIcons name="check-circle" size={14} color={Colors.textWhite} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.addRoleBtn}
            onPress={() => router.push('/persona-onboarding' as any)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-circle-outline" size={18} color={Colors.primaryGreen} />
            <Text style={styles.addRoleText}>Add another role</Text>
          </TouchableOpacity>
        </View>
      </FadeInSection>

      {/* ─── Menu sections ─── */}
      {MENU_SECTIONS.map((section, si) => (
        <FadeInSection key={section.title} delay={320 + si * 80}>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, index < section.items.length - 1 && styles.menuItemBorder]}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.label === 'My Orders') {
                      router.push('/orders');
                    } else if (item.label === 'Order History') {
                      router.push('/order-history');
                    } else if (item.label === 'Saved Items') {
                      router.push('/saved');
                    } else if (item.label === 'My Listings') {
                      router.push('/my-listings');
                    } else if (item.label === 'Add New Listing') {
                      router.push('/add-listing');
                    } else if (item.label === 'My Reviews') {
                      router.push('/my-reviews');
                    } else if (item.label === 'Settings') {
                      router.push('/settings');
                    }
                  }}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.color + '18' }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeInSection>
      ))}

      {/* ─── Logout ─── */}
      <FadeInSection delay={600}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert('Log out', 'You will need to sign in again.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log out',
                style: 'destructive',
                onPress: () => {
                  signOut().catch(() => {}).finally(() => router.replace('/sign-in'));
                },
              },
            ])
          }
        >
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </FadeInSection>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ─── Header ─── */
  profileHeader: {
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 84,
    height: 84,
  },
  avatarEmoji: { fontSize: 38 },
  avatarEditBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryGreen,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 2,
    borderWidth: 2.5,
    borderColor: Colors.primaryGreen,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profileLocation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  /* ─── Stats ─── */
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -18,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10.5,
    color: Colors.textLight,
    fontWeight: '600',
  },

  /* ─── Referral ─── */
  referralCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  referralTextCol: {
    gap: 3,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  referralSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  referralBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryOrange,
  },

  /* ─── Section ─── */
  sectionBlock: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4,
  },

  /* ─── Activity ─── */
  activityCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textDark,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  /* ─── Roles ─── */
  roleHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 10,
    paddingLeft: 4,
    lineHeight: 18,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
  },
  roleChipActive: {
    borderColor: Colors.primaryGreen,
    backgroundColor: Colors.primaryGreen,
  },
  roleChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textDark,
  },
  roleChipTextActive: {
    color: Colors.textWhite,
  },
  addRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingLeft: 4,
    paddingVertical: 6,
  },
  addRoleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.primaryGreen,
  },

  /* ─── Menu ─── */
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.textDark,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  menuBadgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '800',
  },

  /* ─── Logout ─── */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 99,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.error + '25',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },

  bottomSpacer: {
    height: 30,
  },
});
