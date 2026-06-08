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
} from 'react-native';
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
      { icon: 'person', label: 'Edit Profile', color: Colors.primaryGreen },
      { icon: 'notifications', label: 'Notifications', color: Colors.primaryOrange, badge: '3' },
      { icon: 'language', label: 'Language', color: Colors.info },
      { icon: 'location-on', label: 'Saved Locations', color: '#6A1B9A' },
      { icon: 'shield', label: 'Privacy & Security', color: Colors.textMuted },
      { icon: 'info', label: 'About BuildLinka', color: Colors.textMuted },
    ],
  },
];

const RECENT_ACTIVITY = [
  { icon: 'shopping-cart', label: 'Ordered Dangote Cement 42.5R', time: '2 hours ago', color: Colors.primaryGreen },
  { icon: 'handyman', label: 'Hired Emeka Okafor (Mason)', time: '1 day ago', color: Colors.primaryOrange },
  { icon: 'star', label: 'Reviewed TileWorld Nigeria', time: '3 days ago', color: Colors.amber },
];

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
            <Text style={styles.profileName}>Chidi Okonkwo</Text>
            <Text style={styles.profileEmail}>chidi.okonkwo@example.com</Text>
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
            { number: '12', label: 'Orders', color: Colors.primaryGreen },
            { number: '4', label: 'Listings', color: Colors.primaryOrange },
            { number: '8', label: 'Reviews', color: Colors.amber },
            { number: '4.9', label: 'Rating', color: Colors.primaryGreen },
          ].map((stat, i) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={[styles.statNumber, { color: stat.color }]}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </FadeInSection>

      {/* ─── Referral card ─── */}
      <FadeInSection delay={160}>
        <LinearGradient
          colors={[Colors.primaryOrange, '#BF360C']}
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
              <MaterialIcons name="share" size={16} color={Colors.primaryOrange} />
              <Text style={styles.referralBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </FadeInSection>

      {/* ─── Recent Activity ─── */}
      <FadeInSection delay={240}>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {RECENT_ACTIVITY.map((a, i) => (
              <View
                key={i}
                style={[styles.activityRow, i < RECENT_ACTIVITY.length - 1 && styles.activityRowBorder]}
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
        <TouchableOpacity style={styles.logoutBtn}>
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
    borderRadius: 12,
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
    borderRadius: 26,
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
    borderRadius: 18,
    padding: 16,
    boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.07)',
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
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0px 3px 10px 0px rgba(230,81,0,0.25)',
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
    borderRadius: 12,
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
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 6px 0px rgba(0,0,0,0.06)',
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

  /* ─── Menu ─── */
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 6px 0px rgba(0,0,0,0.06)',
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
    borderRadius: 16,
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
