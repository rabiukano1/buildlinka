import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const MAX_BIO = 200;

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('John Doe');
  const [phone, setPhone] = useState('+234 801 234 5678');
  const [email, setEmail] = useState('john.doe@example.com');
  const [location, setLocation] = useState('Ikeja, Lagos');
  const [bio, setBio] = useState('Building materials supplier with 5+ years of experience.');
  const [avatar, setAvatar] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  const pickAvatar = () => {
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    }).then((result) => {
      if (!result.canceled) setAvatar(result.assets[0].uri);
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 800);
  };

  const initials = useMemo(() => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }, [name]);

  const canSave = name.trim() && phone.trim() && email.trim();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Edit Profile' }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.heroArea}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
            <LinearGradient colors={['#0d631b', '#0d631b', '#0d631b']} style={styles.avatarGradient}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </LinearGradient>
            <View style={styles.cameraBtn}>
              <MaterialIcons name="camera-alt" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroRole}>Building Materials Supplier</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <MaterialIcons name="verified" size={12} color={Colors.primary} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
            <View style={styles.badge}>
              <MaterialIcons name="star" size={12} color={Colors.amber} />
              <Text style={styles.badgeText}>4.8 Rating</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>28</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statVr} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>12</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statVr} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>156</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person-outline" size={15} color={Colors.primaryGreen} />
            <Text style={styles.sectionLabel}>Personal Information</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconBox}>
                <MaterialIcons name="badge" size={18} color={Colors.textMuted} />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={Colors.textLight} />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconBox}>
                <MaterialIcons name="phone" size={18} color={Colors.textMuted} />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+234 XXX XXX XXXX" placeholderTextColor={Colors.textLight} keyboardType="phone-pad" />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconBox}>
                <MaterialIcons name="mail-outline" size={18} color={Colors.textMuted} />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={Colors.textLight} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={15} color={Colors.primaryGreen} />
            <Text style={styles.sectionLabel}>Location</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconBox}>
                <MaterialIcons name="location-on" size={18} color={Colors.textMuted} />
              </View>
              <View style={styles.fieldBody}>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, State" placeholderTextColor={Colors.textLight} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={15} color={Colors.primaryGreen} />
            <Text style={styles.sectionLabel}>Bio</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconBox}>
                <MaterialIcons name="description" size={18} color={Colors.textMuted} />
              </View>
              <View style={styles.fieldBody}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={(t) => t.length <= MAX_BIO && setBio(t)}
                  placeholder="Tell others about yourself"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.charCount}>{bio.length}/{MAX_BIO}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="close" size={18} color={Colors.textMedium} />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={!canSave || saving}
        >
          {saving ? (
            <MaterialIcons name="hourglass-top" size={18} color="#fff" />
          ) : (
            <MaterialIcons name="check" size={18} color="#fff" />
          )}
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },

  heroArea: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primaryGreen,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textDark,
  },
  heroRole: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMedium,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVr: {
    width: 1,
    height: 28,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
  },

  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  fieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  fieldBody: { flex: 1 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 11,
  },
  charCount: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
