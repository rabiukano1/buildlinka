import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

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
      { icon: 'notifications', label: 'Notifications', color: Colors.primaryOrange, badge: '3' },
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

export default function SettingsScreen() {
  const router = useRouter();
  const [hideProfile, setHideProfile] = useState(false);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="settings" size={28} color={Colors.primaryGreen} />
          </View>
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
                      else if (item.label === 'Saved Locations') Alert.alert('Coming Soon', 'Saved locations will be available in the next update.');
                      else if (item.label === 'Notifications') Alert.alert('Notifications', 'Notification preferences coming soon.');
                      else if (item.label === 'Language') Alert.alert('Language', 'Language settings coming soon.');
                      else if (item.label === 'Privacy & Security') Alert.alert('Privacy & Security', 'Privacy settings coming soon.');
                      else if (item.label === 'Help Center') Alert.alert('Help Center', 'Help resources coming soon.');
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
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
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
});
