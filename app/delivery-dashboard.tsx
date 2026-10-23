import { Component, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { formatPrice, errorMessage } from '../lib/backend';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

/** Shown when the signed-in user has no store yet (store queries throw then). */
function NoStoreState() {
  const router = useRouter();
  return (
    <View style={styles.centerWrap}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons name="store" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Create your store first</Text>
      <Text style={styles.emptySub}>
        You need a vendor store before you can fulfill and track deliveries.
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.push('/create-store' as any)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-business" size={18} color={Colors.onPrimary} />
        <Text style={styles.primaryBtnText}>Create your store</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Catches the ConvexError thrown when the user has no store, so the
 *  screen shows the create-store CTA instead of crashing. */
class StoreErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <NoStoreState />;
    return this.props.children;
  }
}

const DELIVERY_STEPS = ['Ordered', 'In Transit', 'Near You', 'Delivered'] as const;

const STEP_FOR_STATUS: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
};

type Order = {
  _id: string;
  number: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  buyerName: string;
  items: { name: string; unit: string; price: number; quantity: number }[];
  total: number;
  deliveryMethod: string;
  _creationTime: number;
};

function StepProgress({ currentStep }: { currentStep: number }) {
  const stepCount = DELIVERY_STEPS.length;
  return (
    <View style={styles.stepsContainer}>
      {DELIVERY_STEPS.map((step, i) => {
        const isCompleted = i <= currentStep;
        const isCurrent = i === currentStep;
        const isLast = i === stepCount - 1;
        return (
          <View key={step} style={styles.stepCol}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  isCompleted && styles.stepDotActive,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isCompleted && (
                  <MaterialIcons name="check" size={10} color="#fff" />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isCompleted && styles.stepLabelActive,
                isCurrent && styles.stepLabelCurrent,
              ]}
            >
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ShipmentCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: Order;
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
}) {
  const isDelivered = order.status === 'delivered';
  const statusColor = isDelivered ? Colors.success : Colors.primary;
  const statusLabel = isDelivered ? 'Completed' : order.status === 'pending' ? 'New order' : order.status === 'confirmed' ? 'Confirmed' : 'Shipped';
  const itemSummary = order.items.map((i) => `${i.name} x ${i.quantity}`).join(', ');
  const delivery = useQuery(api.delivery.byOrder, { orderId: order._id as Id<'orders'> });

  return (
    <View style={[styles.shipCard, { borderLeftColor: statusColor }]}>
      <View style={styles.shipHeader}>
        <View style={styles.shipHeaderLeft}>
          <View style={[styles.shipStatusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.shipId}>{order.number}</Text>
          <View style={[styles.shipStatusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.shipStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.shipEta}>{new Date(order._creationTime).toLocaleDateString()}</Text>
      </View>

      <View style={styles.shipBody}>
        <Text style={styles.shipEmoji}>📦</Text>
        <View style={styles.shipInfo}>
          <Text style={styles.shipProduct} numberOfLines={1}>{order.buyerName}</Text>
          <Text style={styles.shipDetail} numberOfLines={2}>{itemSummary}</Text>
          <Text style={styles.shipDetail}>
            {order.deliveryMethod === 'pickup' ? 'Customer pickup' : `Delivery · ${order.deliveryMethod}`}
          </Text>
        </View>
      </View>

      <StepProgress currentStep={STEP_FOR_STATUS[order.status] ?? 0} />

      <View style={styles.shipDriver}>
        <MaterialIcons name="payments" size={15} color={Colors.textMedium} />
        <Text style={styles.shipDriverText}>
          Total {formatPrice(order.total)}
        </Text>
      </View>

      {delivery && (
        <View style={styles.deliveryBox}>
          <View style={styles.deliveryRow}>
            <MaterialIcons name="local-shipping" size={15} color={Colors.primary} />
            <Text style={styles.deliveryCode}>Tracking {delivery.trackingCode}</Text>
            <View style={styles.deliveryStatus}>
              <Text style={styles.deliveryStatusText}>{delivery.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.deliveryMeta}>
            {delivery.courierName ? `Courier: ${delivery.courierName}` : 'Waiting for a courier to claim this delivery'}
          </Text>
          {!!delivery.estimatedAt && <Text style={styles.deliveryMeta}>ETA {new Date(delivery.estimatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>}
        </View>
      )}

      {!isDelivered && (
        <View style={styles.shipActions}>
          <TouchableOpacity style={styles.advanceBtn} onPress={() => onAdvance(order)} activeOpacity={0.8}>
            <Text style={styles.advanceBtnText}>
              {order.status === 'pending' ? 'Confirm' : order.status === 'confirmed' ? 'Mark shipped' : 'Mark delivered'}
            </Text>
          </TouchableOpacity>
          {order.status !== 'shipped' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(order)} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function DeliveryBody() {
  const orders = useQuery(api.orders.forMyStore);
  const setStatus = useMutation(api.orders.setStatus);

  const handleAdvance = async (order: Order) => {
    const next = order.status === 'pending' ? 'confirmed' : order.status === 'confirmed' ? 'shipped' : 'delivered';
    try {
      await setStatus({ id: order._id as never, status: next as never });
    } catch (e) {
      Alert.alert('Could not update order', errorMessage(e));
    }
  };

  const handleCancel = (order: Order) => {
    Alert.alert('Cancel order?', `Cancel ${order.number}? Stock will be returned to your inventory.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await setStatus({ id: order._id as never, status: 'cancelled' as never });
          } catch (e) {
            Alert.alert('Could not cancel', errorMessage(e));
          }
        },
      },
    ]);
  };

  if (orders === undefined) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.emptySub}>Loading deliveries…</Text>
      </View>
    );
  }

  const active = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped');
  const completedCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Map Header ─── */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryContainer]}
        style={styles.mapHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mapGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={styles.mapGridCell} />
          ))}
        </View>
        <View style={styles.mapRouteLine} />
        <View style={[styles.mapPin, styles.mapPinStart]}>
          <MaterialIcons name="location-on" size={18} color="#fff" />
        </View>
        <View style={[styles.mapPin, styles.mapPinEnd]}>
          <MaterialIcons name="flag" size={18} color="#fff" />
        </View>
        <View style={[styles.mapPin, styles.mapPinMid]}>
          <MaterialIcons name="local-shipping" size={16} color="#fff" />
        </View>
        <View style={styles.mapOverlay}>
          <MaterialIcons name="my-location" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.mapText}>Fulfilling store orders</Text>
        </View>
      </LinearGradient>

      {/* ─── Status Counters (real order counts) ─── */}
      <View style={styles.counterRow}>
        <View style={[styles.counterCard, { borderLeftColor: Colors.primary }]}>
          <Text style={styles.counterValue}>{active.length}</Text>
          <Text style={styles.counterLabel}>Active</Text>
        </View>
        <View style={[styles.counterCard, { borderLeftColor: Colors.success }]}>
          <Text style={[styles.counterValue, { color: Colors.success }]}>{completedCount}</Text>
          <Text style={styles.counterLabel}>Completed</Text>
        </View>
        <View style={[styles.counterCard, { borderLeftColor: Colors.error }]}>
          <Text style={[styles.counterValue, { color: Colors.error }]}>{cancelledCount}</Text>
          <Text style={styles.counterLabel}>Cancelled</Text>
        </View>
      </View>

      {/* ─── Active Shipments ─── */}
      <Text style={styles.sectionTitle}>
        Active Shipments
        <Text style={styles.sectionCount}> ({active.length})</Text>
      </Text>
      {active.length === 0 ? (
        <View style={styles.shipCard}>
          <Text style={styles.emptySub}>No active deliveries. New customer orders will appear here.</Text>
        </View>
      ) : (
        active.map((order) => (
          <ShipmentCard key={order._id} order={order as unknown as Order} onAdvance={handleAdvance} onCancel={handleCancel} />
        ))
      )}
    </ScrollView>
  );
}

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const me = useQuery(api.users.me);

  if (me === undefined) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Delivery Dashboard',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Delivery Dashboard',
          headerBackTitle: 'Back',
          headerTintColor: Colors.primary,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={{ marginRight: 4, padding: 4 }}>
              <View>
                <MaterialIcons name="notifications" size={22} color={Colors.primary} />
                {unreadCount > 0 && (
                  <View style={styles.headerNotifBadge}>
                    <Text style={styles.headerNotifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      {!me?.store ? (
        <NoStoreState />
      ) : (
        <StoreErrorBoundary>
          <DeliveryBody />
        </StoreErrorBoundary>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  headerNotifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerNotifBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },

  /* ─── Map Header ─── */
  mapHeader: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGrid: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.15,
  },
  mapGridCell: {
    width: '25%',
    height: '33.33%',
    borderWidth: 0.5,
    borderColor: '#fff',
  },
  mapRouteLine: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinStart: {
    left: '8%',
    top: '38%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mapPinEnd: {
    right: '8%',
    top: '38%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mapPinMid: {
    left: '48%',
    top: '30%',
    backgroundColor: Colors.secondary,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },

  /* ─── Counters ─── */
  counterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  counterCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  counterValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textDark,
  },
  counterLabel: {
    fontSize: 11,
    color: Colors.textMedium,
    fontWeight: '500',
  },

  /* ─── Section ─── */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textLight,
  },

  /* ─── Shipment Card ─── */
  shipCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  shipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shipHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shipStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  shipId: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMedium,
  },
  shipStatusBadge: {
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  shipStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  shipEta: {
    fontSize: 10.5,
    color: Colors.textLight,
    fontWeight: '500',
  },
  shipBody: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  shipEmoji: {
    fontSize: 28,
  },
  shipInfo: {
    flex: 1,
    gap: 1,
  },
  shipProduct: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  shipDetail: {
    fontSize: 11,
    color: Colors.textMedium,
  },

  /* ─── Progress Steps ─── */
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  stepCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: Colors.success,
  },
  stepDotCurrent: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.divider,
    marginHorizontal: -1,
  },
  stepLineActive: {
    backgroundColor: Colors.success,
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.textLight,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.success,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '700',
  },

  /* ─── Driver Info ─── */
  shipDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  shipDriverText: {
    fontSize: 11,
    color: Colors.textMedium,
    flex: 1,
  },
  deliveryBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceVariant,
    gap: 3,
  },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryCode: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textDark },
  deliveryStatus: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: Colors.greenTint },
  deliveryStatusText: { fontSize: 9, fontWeight: '700', color: Colors.primary, textTransform: 'capitalize' },
  deliveryMeta: { fontSize: 10, color: Colors.textMedium },
  shipActions: {
    flexDirection: 'row',
    gap: 8,
  },
  advanceBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingVertical: 10,
  },
  advanceBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    alignItems: 'center',
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.error + '50',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },

  /* ─── Empty ─── */
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.greenTint + '80', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingHorizontal: 8 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.primary, marginTop: 8 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.onPrimary },
});
