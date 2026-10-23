import { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthActions } from '@convex-dev/auth/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Colors } from '../constants/Colors';
import { errorMessage, ROLE_HOME, SIGNUP_ROLES, type Role } from '../lib/backend';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [signupRole, setSignupRole] = useState<Exclude<Role, 'admin'>>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isSignUp = mode === 'signUp';
  const canSubmit = phone.replace(/\D/g, '').length >= 10 && password.length >= (isSignUp ? 8 : 1) && (!isSignUp || name.trim().length >= 2);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      // The account type travels with sign-up and is assigned server-side,
      // so this never depends on a session existing yet.
      await signIn('phone-password', {
        flow: mode,
        phone,
        password,
        ...(isSignUp ? { name: name.trim(), role: signupRole } : {}),
      });
      if (isSignUp) {
        // Vendors set up their store next; everyone else lands via their dashboard.
        router.replace((signupRole === 'vendor' ? '/create-store' : ROLE_HOME[signupRole]) as any);
      } else {
        // Signed-in users land on their own dashboard via the index redirect.
        router.replace('/' as any);
      }
    } catch (err) {
      setError(errorMessage(err, isSignUp ? 'Could not create your account. Please try again.' : 'Wrong phone number or password.'));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isSignUp ? 'signIn' : 'signUp');
    setError('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAwareWrapper contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.logo}>
          <MaterialIcons name="construction" size={36} color={Colors.onPrimary} />
        </View>
        <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
        <Text style={styles.sub}>{isSignUp ? 'Buy materials, sell, or find work — one account for everything.' : 'Sign in with your phone number.'}</Text>

        {isSignUp && (
          <>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amina Bello"
              placeholderTextColor={Colors.outline}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />

            <Text style={styles.label}>I want to use BuildLinka as a</Text>
            <View style={styles.roleGrid}>
              {SIGNUP_ROLES.map((r) => {
                const active = signupRole === r.role;
                return (
                  <TouchableOpacity
                    key={r.role}
                    style={[styles.roleChip, active && styles.roleChipActive]}
                    onPress={() => setSignupRole(r.role)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={r.icon as never}
                      size={22}
                      color={active ? Colors.onPrimary : Colors.primary}
                    />
                    <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{r.title}</Text>
                    <Text style={[styles.roleDesc, active && styles.roleDescActive]} numberOfLines={2}>
                      {r.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.prefix}><Text style={styles.prefixText}>🇳🇬 +234</Text></View>
          <TextInput
            ref={phoneRef}
            style={[styles.input, styles.flex]}
            placeholder="0803 123 4567"
            placeholderTextColor={Colors.outline}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordBox}>
          <TextInput
            ref={passwordRef}
            style={styles.passwordInput}
            placeholder={isSignUp ? 'At least 8 characters' : 'Your password'}
            placeholderTextColor={Colors.outline}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={Colors.outline} />
          </TouchableOpacity>
        </View>
        {isSignUp && password.length > 0 && password.length < 8 && <Text style={styles.hint}>{8 - password.length} more characters</Text>}

        {!!error && (
          <View style={styles.error}>
            <MaterialIcons name="error-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.cta, (!canSubmit || busy) && styles.ctaOff]} onPress={submit} disabled={!canSubmit || busy} activeOpacity={0.85}>
          {busy ? <ActivityIndicator color={Colors.onSecondary} /> : <Text style={styles.ctaText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switch} onPress={switchMode}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? ' : 'New to BuildLinka? '}
            <Text style={styles.switchLink}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </TouchableOpacity>

        {isSignUp && <Text style={styles.terms}>By creating an account you agree to BuildLinka's Terms of Service and Privacy Policy.</Text>}
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 32 },
  flex: { flex: 1 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.onSurface },
  sub: { fontSize: 15, color: Colors.onSurfaceVariant, marginTop: 6, marginBottom: 24, lineHeight: 21 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, marginBottom: 8, marginTop: 16 },
  input: { height: 52, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, fontSize: 16, color: Colors.onSurface },
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefix: { height: 52, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceVariant + '66', justifyContent: 'center' },
  prefixText: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  passwordBox: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card },
  passwordInput: { flex: 1, fontSize: 16, color: Colors.onSurface, paddingVertical: 0 },
  hint: { fontSize: 12, color: Colors.outline, marginTop: 6 },
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: '#ffdad6' },
  errorText: { flex: 1, fontSize: 14, color: Colors.error },
  cta: { height: 54, borderRadius: 999, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  ctaOff: { opacity: 0.5 },
  ctaText: { fontSize: 17, fontWeight: '600', color: Colors.onSecondary },
  switch: { alignItems: 'center', paddingVertical: 20 },
  switchText: { fontSize: 15, color: Colors.onSurfaceVariant },
  switchLink: { color: Colors.primary, fontWeight: '700' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  roleChip: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.card,
    padding: 12,
    gap: 4,
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  roleTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  roleTitleActive: { color: Colors.onPrimary },
  roleDesc: { fontSize: 11.5, color: Colors.onSurfaceVariant, lineHeight: 15 },
  roleDescActive: { color: Colors.onPrimary },
  terms: { fontSize: 12, color: Colors.outline, textAlign: 'center', lineHeight: 17 },
});
