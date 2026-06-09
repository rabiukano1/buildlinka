import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

const { width } = Dimensions.get('window');
const ADMIN_PIN = '1234';

type SettingItem = {
  icon: string;
  label: string;
  color: string;
  badge?: string;
  type?: 'link' | 'toggle';
  desc?: string;
};

const SETTINGS_SECTIONS: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Account',
    items: [
      { icon: 'person', label: 'Edit Profile', color: Colors.primaryGreen, desc: 'Name, phone, photo' },
      { icon: 'location-on', label: 'Saved Locations', color: '#6A1B9A', desc: 'Ikeja, Lagos · Victoria Island' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications', label: 'Notifications', color: Colors.primaryOrange },
      { icon: 'language', label: 'Language', color: Colors.info, desc: 'English' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { icon: 'shield', label: 'Privacy & Security', color: Colors.textMuted, desc: 'Password, data, permissions' },
      { icon: 'visibility-off', label: 'Hide Profile', color: Colors.textMuted, type: 'toggle' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-outline', label: 'Help Center', color: Colors.primaryGreen },
      { icon: 'chat', label: 'Contact Us', color: Colors.primaryOrange },
      { icon: 'info', label: 'About BuildLinka', color: Colors.textMuted, desc: 'Version 2.0.1' },
    ],
  },
];

function PasscodeDot({ filled, error }: { filled: boolean; error: boolean }) {
  return (
    <View style={[styles.pinDot, filled && styles.pinDotFilled, error && styles.pinDotError]} />
  );
}

function PinKey({ label, onPress, type }: { label: string; onPress: (v: string) => void; type?: 'number' | 'backspace' | 'empty' }) {
  if (type === 'empty') return <View style={styles.pinKey} />;
  if (type === 'backspace') {
    return (
      <TouchableOpacity style={styles.pinKey} onPress={() => onPress('backspace')} activeOpacity={0.4}>
        <MaterialIcons name="backspace" size={24} color={Colors.textDark} />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.pinKey} onPress={() => onPress(label)} activeOpacity={0.4}>
      <Text style={styles.pinKeyText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [hideProfile, setHideProfile] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const tapCount = useRef(0);
  const lastTap = useRef(0);

  const handleGearTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 500) {
      tapCount.current += 1;
    } else {
      tapCount.current = 1;
    }
    lastTap.current = now;
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setPin('');
      setPinError(false);
      setShowAdminGate(true);
    }
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
    if (newPin.length === 4) {
      if (newPin === ADMIN_PIN) {
        setShowAdminGate(false);
        setPin('');
        router.push('/admin-panel');
      } else {
        setPinError(true);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        setTimeout(() => { setPin(''); setPinError(false); }, 800);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.avatar} onPress={handleGearTap} activeOpacity={0.7}>
            <MaterialIcons name="settings" size={28} color={Colors.primaryGreen} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Manage your account and preferences</Text>
        </View>

        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => {
                const isLast = idx === section.items.length - 1;
                if (item.type === 'toggle') {
                  return (
                    <View key={item.label} style={[styles.settingRow, !isLast && styles.settingBorder]}>
                      <View style={[styles.iconBox, { backgroundColor: item.color + '18' }]}>
                        <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <View style={styles.settingBody}>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <Switch
                        value={hideProfile}
                        onValueChange={setHideProfile}
                        trackColor={{ false: Colors.outlineVariant, true: Colors.primaryGreen + '60' }}
                        thumbColor={hideProfile ? Colors.primaryGreen : Colors.textLight}
                      />
                    </View>
                  );
                }
                return (
                  <TouchableOpacity key={item.label} style={[styles.settingRow, !isLast && styles.settingBorder]} activeOpacity={0.6}
                    onPress={() => {
                      if (item.label === 'Edit Profile') router.push('/edit-profile');
                      else if (item.label === 'Saved Locations') router.push('/saved-locations');
                      else if (item.label === 'Notifications') router.push('/notifications' as any);
                      else if (item.label === 'Language') Alert.alert('Language', 'Language settings coming soon.');
                      else if (item.label === 'Privacy & Security') router.push('/privacy-security' as any);
                      else if (item.label === 'Help Center') router.push('/help-center' as any);
                      else if (item.label === 'Contact Us') Alert.alert('Contact Us', 'Support contact coming soon.');
                      else if (item.label === 'About BuildLinka') Alert.alert('About BuildLinka', 'BuildLinka v2.0.1\nYour trusted construction materials marketplace.');
                    }}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.color + '18' }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.settingBody}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      {item.desc && <Text style={styles.settingDesc}>{item.desc}</Text>}
                    </View>
                    {item.label === 'Notifications' && unreadCount > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    ) : item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                    <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAdminGate} transparent animationType="fade" onRequestClose={() => { setShowAdminGate(false); setPin(''); setPinError(false); }}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowAdminGate(false); setPin(''); setPinError(false); }}>
              <MaterialIcons name="close" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <View style={styles.modalLockIcon}>
              <MaterialIcons name="lock" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Admin Access</Text>
            <Text style={styles.modalSub}>Enter passcode to continue</Text>

            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <PasscodeDot key={i} filled={pin.length > i} error={pinError} />
              ))}
            </View>

            <View style={styles.pinPad}>
              {['1','2','3','4','5','6','7','8','9','','0','backspace'].map((v) => (
                <PinKey
                  key={v}
                  label={v}
                  onPress={handlePinPress}
                  type={v === '' ? 'empty' : v === 'backspace' ? 'backspace' : 'number'}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },

  headerCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
    gap: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textLight,
  },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '60',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingBody: { flex: 1 },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    backgroundColor: Colors.error + '08',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },

  /* ─── Passcode Modal ─── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    width: width - 48,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLockIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryGreen + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.outlineVariant,
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
  },
  pinDotError: {
    backgroundColor: Colors.error,
  },
  pinPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    width: '100%',
    maxWidth: 280,
  },
  pinKey: {
    width: 80,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  pinKeyText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textDark,
  },
});
