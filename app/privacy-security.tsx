import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [twoFactor, setTwoFactor] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.primary, '#0a5215', Colors.primaryContainer]}
        style={[styles.header, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.2 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Privacy & Security</Text>
            <Text style={styles.headerSub}>Password, data, and permissions</Text>
          </View>
          <MaterialIcons name="shield" size={22} color="rgba(255,255,255,0.5)" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="lock-outline" size={16} color={Colors.primary} />
            <Text style={styles.sectionLabel}>Password & Authentication</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.6} onPress={() => Alert.alert('Change Password', 'Password reset link will be sent to your email.')}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '18' }]}>
                <MaterialIcons name="key" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingDesc}>Last updated 3 months ago</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '18' }]}>
                <MaterialIcons name="verified-user" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                <Text style={styles.settingDesc}>Add an extra layer of security</Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={setTwoFactor}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primary + '60' }}
                thumbColor={twoFactor ? Colors.primary : Colors.textLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="visibility" size={16} color={Colors.info} />
            <Text style={styles.sectionLabel}>Profile Visibility</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.info + '18' }]}>
                <MaterialIcons name="mail-outline" size={20} color={Colors.info} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Show Email</Text>
                <Text style={styles.settingDesc}>Display your email on your profile</Text>
              </View>
              <Switch
                value={showEmail}
                onValueChange={setShowEmail}
                trackColor={{ false: Colors.outlineVariant, true: Colors.info + '60' }}
                thumbColor={showEmail ? Colors.info : Colors.textLight}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.info + '18' }]}>
                <MaterialIcons name="phone" size={20} color={Colors.info} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Show Phone Number</Text>
                <Text style={styles.settingDesc}>Display your phone on your profile</Text>
              </View>
              <Switch
                value={showPhone}
                onValueChange={setShowPhone}
                trackColor={{ false: Colors.outlineVariant, true: Colors.info + '60' }}
                thumbColor={showPhone ? Colors.info : Colors.textLight}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.info + '18' }]}>
                <MaterialIcons name="location-on" size={20} color={Colors.info} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Show Location</Text>
                <Text style={styles.settingDesc}>Display your city on your profile</Text>
              </View>
              <Switch
                value={showLocation}
                onValueChange={setShowLocation}
                trackColor={{ false: Colors.outlineVariant, true: Colors.info + '60' }}
                thumbColor={showLocation ? Colors.info : Colors.textLight}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="analytics" size={16} color={Colors.amber} />
            <Text style={styles.sectionLabel}>Data & Privacy</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: Colors.amber + '18' }]}>
                <MaterialIcons name="insights" size={20} color={Colors.amber} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Usage Analytics</Text>
                <Text style={styles.settingDesc}>Help us improve your experience</Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
                trackColor={{ false: Colors.outlineVariant, true: Colors.amber + '60' }}
                thumbColor={analytics ? Colors.amber : Colors.textLight}
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.6} onPress={() => Alert.alert('Download Data', 'Your data export will be emailed to you within 48 hours.')}>
              <View style={[styles.iconBox, { backgroundColor: Colors.amber + '18' }]}>
                <MaterialIcons name="download" size={20} color={Colors.amber} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Download My Data</Text>
                <Text style={styles.settingDesc}>Export your account information</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.6} onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy at buildlinka.com/privacy')}>
              <View style={[styles.iconBox, { backgroundColor: Colors.amber + '18' }]}>
                <MaterialIcons name="description" size={20} color={Colors.amber} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDesc}>How we handle your data</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="warning" size={16} color={Colors.error} />
            <Text style={styles.sectionLabel}>Danger Zone</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.6} onPress={() => {
              Alert.alert('Delete Account', 'This action cannot be undone. All your data will be permanently removed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account Deletion', 'Your account deletion request has been submitted. You will receive a confirmation email.') },
              ]);
            }}>
              <View style={[styles.iconBoxDanger]}>
                <MaterialIcons name="delete-forever" size={20} color={Colors.error} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.dangerLabel}>Delete Account</Text>
                <Text style={styles.settingDesc}>Permanently remove your account and data</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerNote}>
          <MaterialIcons name="security" size={14} color={Colors.textMuted} />
          <Text style={styles.footerNoteText}>Your data is encrypted and secure.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* ─── Header ─── */
  header: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  content: { padding: 16, gap: 4 },

  /* ─── Sections ─── */
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginLeft: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  divider: { height: 1, backgroundColor: Colors.outlineVariant + '60', marginLeft: 66 },

  /* ─── Setting rows ─── */
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconBoxDanger: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.error + '12', alignItems: 'center', justifyContent: 'center' },
  settingBody: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  settingDesc: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  dangerLabel: { fontSize: 14, fontWeight: '600', color: Colors.error },

  /* ─── Footer ─── */
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  footerNoteText: { fontSize: 11, color: Colors.textMuted },
});
