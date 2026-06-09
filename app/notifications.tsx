import { useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationItem } from '../constants/MockData';

const NOTIF_ICONS: Record<string, { bg: string; icon: string; color: string }> = {
  order: { bg: '#0d631b15', icon: 'local-shipping', color: '#0d631b' },
  price_drop: { bg: '#a8390015', icon: 'trending-down', color: '#a83900' },
  worker: { bg: '#6d510015', icon: 'handyman', color: '#6d5100' },
  stock: { bg: '#ba1a1a12', icon: 'inventory-2', color: '#ba1a1a' },
  review: { bg: '#0d631b10', icon: 'star', color: '#f5a623' },
  payment: { bg: '#0d631b10', icon: 'payment', color: '#0d631b' },
  job: { bg: '#6d510015', icon: 'work', color: '#6d5100' },
  system: { bg: '#707a6c15', icon: 'new-releases', color: '#40493d' },
};

function NotifCard({ item, index }: { item: NotificationItem; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const { markAsRead, dismissNotification } = useNotifications();
  const router = useRouter();

  useMemo(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 50, friction: 9, tension: 65, useNativeDriver: true }).start();
  }, []);

  const iconCfg = NOTIF_ICONS[item.type] || NOTIF_ICONS.system;

  const handlePress = () => {
    if (!item.read) markAsRead(item.id);
    if (item.actionRoute) {
      router.push(item.actionRoute as any);
    }
  };

  const handleLongPress = () => {
    Alert.alert('Dismiss Notification', `Remove this notification?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dismiss', style: 'destructive', onPress: () => dismissNotification(item.id) },
    ]);
  };

  return (
    <Animated.View style={[styles.card, { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
      <TouchableOpacity style={styles.cardTouch} onPress={handlePress} onLongPress={handleLongPress} activeOpacity={0.7}>
        <View style={[styles.cardIcon, { backgroundColor: iconCfg.bg }]}>
          <MaterialIcons name={iconCfg.icon as any} size={20} color={iconCfg.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
          <View style={styles.cardMeta}>
            <MaterialIcons name="access-time" size={10} color={Colors.textLight} />
            <Text style={styles.cardTime}>{item.timestamp}</Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

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
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.7}>
              <MaterialIcons name="done-all" size={18} color="#fff" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="notifications-none" size={44} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>You have no notifications at this time.</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <MaterialIcons name="notifications-active" size={14} color={Colors.textLight} />
              <Text style={styles.sectionLabel}>RECENT</Text>
            </View>
            {notifications.map((item, i) => (
              <NotifCard key={item.id} item={item} index={i} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3f0' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },

  header: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6, zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  headerTitleArea: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1, fontWeight: '500' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  markAllText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6 },

  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  cardTouch: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textDark, flex: 1 },
  cardTitleUnread: { fontWeight: '800', color: '#000' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  cardMsg: { fontSize: 12, color: Colors.textMedium, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardTime: { fontSize: 10, color: Colors.textLight, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  emptySub: { fontSize: 14, color: Colors.textLight },
});
