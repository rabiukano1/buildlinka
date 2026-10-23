import { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Modal, Animated } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

// ponytail: client-side PIN is only a hidden-door, real admin auth belongs on the backend
const ADMIN_PIN = '1234';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

type RowProps = {
  icon: string;
  label: string;
  color: string;
  desc?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  badge?: number;
};

function Row({ icon, label, color, desc, onPress, toggle, badge }: RowProps) {
  const content = (
    <>
      <View style={[styles.iconTile, { backgroundColor: color + '1a' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
          thumbColor="#fff"
          ios_backgroundColor={Colors.outlineVariant}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={22} color={Colors.outline} />
      )}
    </>
  );
  return toggle ? (
    <View style={styles.row}>{content}</View>
  ) : (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>{content}</TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const rows = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 && <View style={styles.divider} />}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const isVendor = role === 'vendor';
  const { unreadCount } = useNotifications();
  const me = useQuery(api.users.me);
  const [hideProfile, setHideProfile] = useState(false);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  const initials = (me?.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const handleVersionTap = () => {
    const now = Date.now();
    tapCount.current = now - lastTap.current < 500 ? tapCount.current + 1 : 1;
    lastTap.current = now;
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setPin('');
      setPinError(false);
      setShowAdminGate(true);
    }
  };

  const closeAdminGate = () => {
    setShowAdminGate(false);
    setPin('');
    setPinError(false);
  };

  const handlePinPress = (val: string) => {
    if (val === 'backspace') {
      setPin((p) => p.slice(0, -1));
      setPinError(false);
      return;
    }
    if (pin.length >= 4) return;
    const newPin = pin + val;
    setPin(newPin);
    if (newPin.length < 4) return;
    if (newPin === ADMIN_PIN) {
      closeAdminGate();
      router.push('/admin-panel');
      return;
    }
    setPinError(true);
    Animated.sequence([10, -10, 8, -8, 0].map((toValue) =>
      Animated.timing(shakeAnim, { toValue, duration: 50, useNativeDriver: true })
    )).start();
    setTimeout(() => { setPin(''); setPinError(false); }, 800);
  };

  const handleLogout = () =>
    Alert.alert('Log out', 'You will need to sign in again to manage your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() => {}).finally(() => router.replace('/sign-in'));
        },
      },
    ]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Settings', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background } }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/edit-profile')} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.profileName}>{me?.name || 'Your profile'}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{me?.phone || me?.email || ''}</Text>
            {isVendor && (
              <View style={styles.roleChip}>
                <MaterialIcons name="storefront" size={12} color={Colors.primary} />
                <Text style={styles.roleChipText}>Vendor</Text>
              </View>
            )}
          </View>
          <View style={styles.editPill}>
            <Text style={styles.editPillText}>Edit</Text>
          </View>
        </TouchableOpacity>

        {isVendor && (
          <Section title="Store">
            <Row
              icon={acceptingOrders ? 'store' : 'storefront'}
              label="Accepting orders"
              desc={acceptingOrders ? 'Buyers can place new orders' : 'Store paused · listings hidden from buyers'}
              color={acceptingOrders ? Colors.primary : Colors.outline}
              toggle={{ value: acceptingOrders, onChange: setAcceptingOrders }}
            />
            <Row icon="inventory-2" label="My Store" desc="Listings & inventory" color={Colors.primary} onPress={() => router.push('/my-listings')} />
            <Row icon="bar-chart" label="Sales & Analytics" desc="Revenue, orders, top products" color={Colors.tertiary} onPress={() => router.push('/sales-analytics' as any)} />
            <Row
              icon="warning-amber"
              label="Low-stock alerts"
              desc="Notify me when items hit their minimum level"
              color={Colors.secondary}
              toggle={{ value: stockAlerts, onChange: setStockAlerts }}
            />
          </Section>
        )}

        <Section title="Account">
          <Row icon="location-on" label="Saved Locations" desc="Ikeja, Lagos · Victoria Island" color={Colors.secondary} onPress={() => router.push('/saved-locations')} />
          <Row icon="lock" label="Privacy & Security" desc="Password, data, permissions" color={Colors.primary} onPress={() => router.push('/privacy-security' as any)} />
          <Row
            icon="visibility-off"
            label="Hide profile"
            desc="Others can't find you in search"
            color={Colors.outline}
            toggle={{ value: hideProfile, onChange: setHideProfile }}
          />
        </Section>

        <Section title="Preferences">
          <Row icon="notifications" label="Notifications" color={Colors.secondary} badge={unreadCount} onPress={() => router.push('/notifications' as any)} />
          <Row icon="language" label="Language" desc="English" color={Colors.tertiary} onPress={() => Alert.alert('Language', 'More languages are coming soon.')} />
        </Section>

        <Section title="Support">
          <Row icon="help-outline" label="Help Center" color={Colors.primary} onPress={() => router.push('/help-center' as any)} />
          <Row icon="chat-bubble-outline" label="Contact Us" color={Colors.secondary} onPress={() => Alert.alert('Contact Us', 'Support contact coming soon.')} />
          <Row
            icon="info-outline"
            label="About BuildLinka"
            color={Colors.outline}
            onPress={() => Alert.alert('About BuildLinka', `Version ${APP_VERSION}\nYour trusted construction materials marketplace.`)}
          />
        </Section>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.version} onPress={handleVersionTap} suppressHighlighting>
          BuildLinka v{APP_VERSION}
        </Text>
      </ScrollView>

      <Modal visible={showAdminGate} transparent animationType="fade" onRequestClose={closeAdminGate}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}>
            <TouchableOpacity style={styles.modalClose} onPress={closeAdminGate} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
            <View style={styles.lockTile}>
              <MaterialIcons name="lock" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Admin access</Text>
            <Text style={styles.modalSub}>{pinError ? 'Wrong passcode, try again' : 'Enter passcode to continue'}</Text>

            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled, pinError && styles.pinDotError]} />
              ))}
            </View>

            <View style={styles.pinPad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'].map((v) =>
                v === '' ? (
                  <View key="empty" style={styles.pinKeyEmpty} />
                ) : (
                  <TouchableOpacity key={v} style={styles.pinKey} onPress={() => handlePinPress(v)} activeOpacity={0.5}>
                    {v === 'backspace'
                      ? <MaterialIcons name="backspace" size={22} color={Colors.onSurface} />
                      : <Text style={styles.pinKeyText}>{v}</Text>}
                  </TouchableOpacity>
                )
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.card,
    marginBottom: 24,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.onPrimary },
  profileName: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  profileEmail: { fontSize: 14, color: Colors.outline, marginTop: 2 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.greenTint,
  },
  roleChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  editPill: { paddingHorizontal: 16, height: 36, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant },
  editPillText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant, letterSpacing: 0.14, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 64, paddingVertical: 12 },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 68 },
  iconTile: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '500', color: Colors.onSurface },
  rowDesc: { fontSize: 13, color: Colors.outline, marginTop: 2, lineHeight: 18 },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.onSecondary },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.error + '4d',
    backgroundColor: Colors.card,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.error },
  version: { fontSize: 12, color: Colors.outline, textAlign: 'center', marginTop: 16, paddingVertical: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: Colors.card, borderRadius: 24, padding: 24, alignItems: 'center' },
  modalClose: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceVariant + '99', alignItems: 'center', justifyContent: 'center' },
  lockTile: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.greenTint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.onSurface },
  modalSub: { fontSize: 14, color: Colors.outline, marginTop: 4 },
  pinDots: { flexDirection: 'row', gap: 16, paddingVertical: 24 },
  pinDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.outlineVariant },
  pinDotFilled: { backgroundColor: Colors.primary },
  pinDotError: { backgroundColor: Colors.error },
  pinPad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 264 },
  pinKey: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceVariant + '80', alignItems: 'center', justifyContent: 'center' },
  pinKeyEmpty: { width: 72, height: 72 },
  pinKeyText: { fontSize: 26, fontWeight: '600', color: Colors.onSurface },
});
