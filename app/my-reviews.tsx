import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Colors } from '../constants/Colors';
import { errorMessage } from '../lib/backend';

type Reviewable = {
  targetType: 'product' | 'store' | 'worker';
  targetId: string;
  targetName: string;
  targetRoute: string;
  imageUrl: string | null;
  orderId: string | null;
  jobId: string | null;
  date: number;
};

export default function MyReviewsScreen() {
  const router = useRouter();
  const me = useQuery(api.users.me);
  const reviews = useQuery(api.reviews.mine, me ? {} : 'skip');
  const pending = useQuery(api.reviews.reviewables, me ? {} : 'skip');
  const create = useMutation(api.reviews.create);
  const remove = useMutation(api.reviews.remove);

  const [tab, setTab] = useState<'pending' | 'written'>('pending');
  const [target, setTarget] = useState<Reviewable | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!target || rating < 1) {
      Alert.alert('Add a rating', 'Tap a star to rate this item.');
      return;
    }
    setSaving(true);
    try {
      await create({
        targetType: target.targetType,
        targetId: target.targetId,
        rating,
        comment: comment.trim() || undefined,
        orderId: target.orderId ? target.orderId as Id<'orders'> : undefined,
        jobId: target.jobId ? target.jobId as Id<'jobs'> : undefined,
      });
      setTarget(null);
      setRating(0);
      setComment('');
      setTab('written');
      Alert.alert('Review posted', 'Thanks for helping the community.');
    } catch (err) {
      Alert.alert('Could not post review', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (id: string) => {
    Alert.alert('Delete review?', 'This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await remove({ id: id as Id<'reviews'> }); } catch (err) { Alert.alert('Could not delete', errorMessage(err)); }
      } },
    ]);
  };

  if (me === undefined) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator color={Colors.primary} /></View>;
  }
  if (!me) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerTitle: 'My Reviews' }} />
        <Text style={styles.emptyTitle}>Sign in to see your reviews</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/sign-in' as any)}>
          <Text style={styles.primaryBtnText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'My Reviews' }} />
      <View style={styles.tabs}>
        {(['pending', 'written'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pending' ? `To review${pending?.length ? ` (${pending.length})` : ''}` : `Written${reviews?.length ? ` (${reviews.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'pending' ? (
          pending === undefined ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : pending.length === 0 ? (
            <Empty
              icon="star-outline"
              title="Nothing to review yet"
              sub="Once an order is delivered or a hired job is completed, you can rate the vendor, product or worker here."
              action="Browse materials"
              onPress={() => router.push('/(tabs)' as any)}
            />
          ) : pending.map((item) => (
            <View key={`${item.targetType}:${item.targetId}`} style={styles.card}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbIcon]}>
                  <MaterialIcons name={item.targetType === 'worker' ? 'handyman' : item.targetType === 'store' ? 'storefront' : 'inventory-2'} size={24} color={Colors.primary} />
                </View>
              )}
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>{item.targetName}</Text>
                <Text style={styles.meta}>{labelFor(item.targetType)} · {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <TouchableOpacity style={styles.reviewBtn} onPress={() => { setTarget(item); setRating(0); setComment(''); }}>
                  <MaterialIcons name="star" size={15} color={Colors.onPrimary} />
                  <Text style={styles.reviewBtnText}>Write review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          reviews === undefined ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : reviews.length === 0 ? (
            <Empty icon="rate-review" title="No reviews yet" sub="Reviews you write will appear here." action="See what to review" onPress={() => setTab('pending')} />
          ) : reviews.map((r) => (
            <View key={r._id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <TouchableOpacity style={styles.flex} onPress={() => r.targetRoute && router.push(r.targetRoute as any)}>
                  <Text style={styles.name} numberOfLines={1}>{r.targetName}</Text>
                  <Text style={styles.meta}>{labelFor(r.targetType)}</Text>
                </TouchableOpacity>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => <MaterialIcons key={n} name={n <= r.rating ? 'star' : 'star-border'} size={15} color={Colors.amber} />)}
                </View>
              </View>
              {!!r.comment && <Text style={styles.comment}>{r.comment}</Text>}
              {r.reply && (
                <View style={styles.reply}>
                  <Text style={styles.replyLabel}>Vendor reply</Text>
                  <Text style={styles.replyText}>{r.reply}</Text>
                </View>
              )}
              <View style={styles.reviewFoot}>
                <Text style={styles.meta}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={() => confirmRemove(r._id)} hitSlop={8}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!target} transparent animationType="slide" onRequestClose={() => setTarget(null)}>
        <View style={styles.modalWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Rate {labelFor(target?.targetType)}</Text>
              <TouchableOpacity onPress={() => setTarget(null)} hitSlop={8}><MaterialIcons name="close" size={22} color={Colors.outline} /></TouchableOpacity>
            </View>
            <Text style={styles.targetName}>{target?.targetName}</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6}>
                  <MaterialIcons name={n <= rating ? 'star' : 'star-border'} size={38} color={Colors.amber} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Share details about quality, timeliness or service (optional)"
              placeholderTextColor={Colors.outline}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.onPrimary} /> : <Text style={styles.primaryBtnText}>Post review</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function labelFor(type?: string) {
  return type === 'worker' ? 'worker' : type === 'store' ? 'vendor' : 'product';
}

function Empty({ icon, title, sub, action, onPress }: { icon: string; title: string; sub: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}><MaterialIcons name={icon as any} size={36} color={Colors.primary} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onPress}><Text style={styles.primaryBtnText}>{action}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', margin: 16, marginBottom: 4, padding: 4, borderRadius: 999, backgroundColor: Colors.surfaceVariant },
  tab: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: Colors.card, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  tabTextActive: { color: Colors.primary },
  content: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 10 },
  thumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: Colors.surfaceVariant },
  thumbIcon: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  meta: { fontSize: 11, color: Colors.outline, marginTop: 2 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.primary },
  reviewBtnText: { fontSize: 11, fontWeight: '700', color: Colors.onPrimary },
  reviewCard: { padding: 14, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 10 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', gap: 1 },
  comment: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19, marginTop: 8 },
  reply: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: Colors.surfaceVariant + '80' },
  replyLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  replyText: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3, lineHeight: 17 },
  reviewFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  delete: { fontSize: 11, fontWeight: '700', color: Colors.error },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.amberLight + '80', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.outline, textAlign: 'center', lineHeight: 20 },
  primaryBtn: { minHeight: 44, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: Colors.onPrimary },
  disabled: { opacity: 0.6 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  targetName: { fontSize: 14, fontWeight: '600', color: Colors.onSurfaceVariant, marginTop: 4 },
  starPicker: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 16 },
  input: { minHeight: 96, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.card, padding: 12, color: Colors.onSurface, fontSize: 14, textAlignVertical: 'top' },
});
