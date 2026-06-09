import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const FAQS = [
  { q: 'How do I place an order?', a: 'Browse products, add items to your cart, and proceed to checkout. You can pay via card or bank transfer.' },
  { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, bank transfers, and mobile money. All payments are processed securely.' },
  { q: 'How long does delivery take?', a: 'Delivery typically takes 2-5 business days depending on your location. Large orders may take longer.' },
  { q: 'Can I return a product?', a: 'Yes, you can return items within 14 days of delivery. Items must be unused and in original packaging.' },
  { q: 'How do I contact a worker?', a: 'Browse the Workers Marketplace, tap on a worker card, and use the "Hire" button to send a request.' },
  { q: 'How do I become a vendor?', a: 'Sign up as a vendor during onboarding or go to Settings > Edit Profile to switch your account type.' },
  { q: 'Is my data secure?', a: 'Yes, all your personal and payment data is encrypted and stored securely. We never share your data with third parties.' },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = FAQS.filter((f) => f.q.toLowerCase().includes(search.toLowerCase()));

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
            <Text style={styles.headerTitle}>Help Center</Text>
            <Text style={styles.headerSub}>Find answers and get support</Text>
          </View>
          <MaterialIcons name="help-outline" size={22} color="rgba(255,255,255,0.5)" />
        </View>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.contactGrid}>
          <TouchableOpacity style={styles.contactCard} activeOpacity={0.7} onPress={() => Linking.openURL('https://wa.me/2348088325352').catch(() => Alert.alert('WhatsApp', 'Please install WhatsApp to chat with us.'))}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.primary + '18' }]}>
              <MaterialIcons name="chat" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Live Chat</Text>
            <Text style={styles.contactDesc}>Chat on WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} activeOpacity={0.7} onPress={() => Linking.openURL('mailto:biladamaweldingconstructions@gmail.com').catch(() => Alert.alert('Email', 'Could not open email client.'))}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.primaryOrange + '18' }]}>
              <MaterialIcons name="email" size={22} color={Colors.primaryOrange} />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
            <Text style={styles.contactDesc}>biladamaweldingconstructions@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} activeOpacity={0.7} onPress={() => Linking.openURL('tel:08088325352').catch(() => Alert.alert('Phone', 'Could not open dialer.'))}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.info + '18' }]}>
              <MaterialIcons name="phone" size={22} color={Colors.info} />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactDesc}>0808 832 5352</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="question-answer" size={16} color={Colors.primary} />
            <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
          </View>
          <View style={styles.card}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : (
              filtered.map((faq, i) => {
                const isExpanded = expanded === i;
                const isLast = i === filtered.length - 1;
                return (
                  <View key={i}>
                    <TouchableOpacity
                      style={styles.faqRow}
                      activeOpacity={0.6}
                      onPress={() => setExpanded(isExpanded ? null : i)}
                    >
                      <View style={styles.faqQWrap}>
                        <Text style={styles.faqQ}>{faq.q}</Text>
                      </View>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={Colors.textLight}
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.faqA}>
                        <Text style={styles.faqAText}>{faq.a}</Text>
                      </View>
                    )}
                    {!isLast && <View style={styles.faqDivider} />}
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="article" size={16} color={Colors.amber} />
            <Text style={styles.sectionLabel}>Quick Guides</Text>
          </View>
          <View style={styles.card}>
            {[
              { icon: 'shopping-cart', label: 'How to Place an Order', desc: 'Step-by-step ordering guide' },
              { icon: 'store', label: 'Setting Up Your Vendor Store', desc: 'Start selling on BuildLinka' },
              { icon: 'engineering', label: 'Finding & Hiring Workers', desc: 'Worker marketplace guide' },
              { icon: 'local-shipping', label: 'Delivery & Tracking', desc: 'Track your orders' },
            ].map((guide, i) => (
              <TouchableOpacity key={i} style={[styles.guideRow, i < 3 && styles.guideBorder]} activeOpacity={0.6} onPress={() => Alert.alert(guide.label, `${guide.desc}\n\nFull guide coming soon.`)}>
                <View style={[styles.guideIcon, { backgroundColor: Colors.amber + '18' }]}>
                  <MaterialIcons name={guide.icon as any} size={18} color={Colors.amber} />
                </View>
                <View style={styles.guideBody}>
                  <Text style={styles.guideLabel}>{guide.label}</Text>
                  <Text style={styles.guideDesc}>{guide.desc}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* ─── Header ─── */
  header: { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', height: 40 },

  content: { padding: 16, gap: 4 },

  /* ─── Contact Grid ─── */
  contactGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  contactCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 12, fontWeight: '700', color: Colors.textDark },
  contactDesc: { fontSize: 9, color: Colors.textLight, textAlign: 'center' },

  /* ─── Sections ─── */
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginLeft: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },

  /* ─── FAQ ─── */
  faqRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  faqQWrap: { flex: 1 },
  faqQ: { fontSize: 13, fontWeight: '600', color: Colors.textDark, lineHeight: 18 },
  faqA: { paddingHorizontal: 16, paddingBottom: 14 },
  faqAText: { fontSize: 12, color: Colors.textMedium, lineHeight: 18 },
  faqDivider: { height: 1, backgroundColor: Colors.outlineVariant + '60', marginLeft: 16 },

  /* ─── Empty ─── */
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.textMuted },

  /* ─── Guides ─── */
  guideRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  guideBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '60' },
  guideIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guideBody: { flex: 1 },
  guideLabel: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  guideDesc: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
});
