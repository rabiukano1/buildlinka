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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { errorMessage, goBackOrHome } from '../lib/backend';
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
  const me = useQuery(api.users.me);
  const tickets = useQuery(api.support.mine, me ? {} : 'skip');
  const createTicket = useMutation(api.support.create);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'order' | 'payment' | 'delivery' | 'worker' | 'account' | 'other'>('order');
  const [sending, setSending] = useState(false);

  const filtered = FAQS.filter((f) => f.q.toLowerCase().includes(search.toLowerCase()));

  const submitTicket = async () => {
    if (!me) {
      setTicketOpen(false);
      router.push('/sign-in' as any);
      return;
    }
    if (subject.trim().length < 4 || message.trim().length < 10) {
      Alert.alert('Add more detail', 'Use a subject of 4+ characters and a message of 10+ characters.');
      return;
    }
    setSending(true);
    try {
      await createTicket({ subject: subject.trim(), message: message.trim(), category });
      setTicketOpen(false);
      setSubject('');
      setMessage('');
      setCategory('order');
      Alert.alert('Ticket created', 'Our support team will reply in the app. You can track it here.');
    } catch (err) {
      Alert.alert('Could not create ticket', errorMessage(err));
    } finally {
      setSending(false);
    }
  };

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
          <TouchableOpacity style={styles.backBtn} onPress={() => goBackOrHome()} activeOpacity={0.7}>
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

        <TouchableOpacity style={styles.ticketCta} onPress={() => setTicketOpen(true)} activeOpacity={0.8}>
          <View style={styles.ticketCtaIcon}><MaterialIcons name="support-agent" size={24} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketCtaTitle}>Open a support ticket</Text>
            <Text style={styles.ticketCtaSub}>Tracked in the app — no email needed</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {!!me && tickets && tickets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="confirmation-number" size={16} color={Colors.primary} />
              <Text style={styles.sectionLabel}>My Tickets</Text>
            </View>
            <View style={styles.card}>
              {tickets.map((t) => (
                <View key={t._id} style={styles.ticketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
                    <Text style={styles.ticketMeta}>{t.category} · {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{t.replyCount ? ` · ${t.replyCount} repl${t.replyCount === 1 ? 'y' : 'ies'}` : ''}</Text>
                  </View>
                  <View style={[styles.ticketStatus, { backgroundColor: t.status === 'open' ? Colors.greenTint : Colors.amberLight }]}>
                    <Text style={[styles.ticketStatusText, { color: t.status === 'open' ? Colors.primary : Colors.amber }]}>{t.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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

      <Modal visible={ticketOpen} transparent animationType="slide" onRequestClose={() => setTicketOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Contact support</Text>
              <TouchableOpacity onPress={() => setTicketOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {(['order', 'payment', 'delivery', 'worker', 'account', 'other'] as const).map((c) => (
                <TouchableOpacity key={c} style={[styles.categoryChip, category === c && styles.categoryChipActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.categoryText, category === c && styles.categoryTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Subject</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Order not delivered"
              placeholderTextColor={Colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
            <Text style={styles.modalLabel}>How can we help?</Text>
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              placeholder="Give us the details, including your order number if relevant."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={[styles.modalSend, sending && { opacity: 0.6 }]} onPress={submitTicket} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSendText}>Create ticket</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  /* ─── Support tickets ─── */
  ticketCta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primary, borderRadius: 14, padding: 14, marginBottom: 20 },
  ticketCtaIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  ticketCtaTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ticketCtaSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '60' },
  ticketSubject: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  ticketMeta: { fontSize: 10.5, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  ticketStatus: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  ticketStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  modalLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMedium, marginTop: 10, marginBottom: 6 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: Colors.surfaceVariant },
  categoryChipActive: { backgroundColor: Colors.primary },
  categoryText: { fontSize: 12, fontWeight: '600', color: Colors.textMedium, textTransform: 'capitalize' },
  categoryTextActive: { color: '#fff' },
  modalInput: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.background, paddingHorizontal: 12, color: Colors.textDark, fontSize: 14 },
  modalMultiline: { height: 100, paddingTop: 10, textAlignVertical: 'top' },
  modalSend: { height: 48, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  modalSendText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
