import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../contexts/NotificationContext';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const DELIVERY_STEPS = ['Ordered', 'In Transit', 'Near You', 'Delivered'] as const;

const SHIPMENTS = [
  {
    id: 'SHP-001',
    product: 'Dangote Cement 42.5R (50kg)',
    emoji: '🏗️',
    qty: 50,
    vendor: 'Lagos Building Supplies',
    destination: 'Ikeja, Lagos',
    status: 'active' as const,
    currentStep: 1,
    eta: 'Today, 4:30 PM',
    driver: 'Ahmed Musa',
    driverVehicle: 'Truck - ABC 123 XZ',
  },
  {
    id: 'SHP-002',
    product: 'Iron Rod 12mm (6m)',
    emoji: '⚙️',
    qty: 20,
    vendor: 'Steel Masters Ltd',
    destination: 'Surulere, Lagos',
    status: 'active' as const,
    currentStep: 2,
    eta: 'Today, 5:45 PM',
    driver: 'Chidi Okonkwo',
    driverVehicle: 'Truck - XYZ 789 GT',
  },
  {
    id: 'SHP-003',
    product: 'Ceramic Floor Tiles 60x60cm',
    emoji: '🏛️',
    qty: 30,
    vendor: 'TileWorld Nigeria',
    destination: 'Victoria Island, Lagos',
    status: 'active' as const,
    currentStep: 0,
    eta: 'Tomorrow, 10:00 AM',
    driver: 'Bello Ibrahim',
    driverVehicle: 'Van - DEF 456 RT',
  },
  {
    id: 'SHP-004',
    product: 'Emulsion Paint 20L (White)',
    emoji: '🎨',
    qty: 5,
    vendor: 'ColourShop Abuja',
    destination: 'Wuse, Abuja',
    status: 'completed' as const,
    currentStep: 3,
    eta: 'Delivered 2 hrs ago',
    driver: 'Suleiman Yahaya',
    driverVehicle: 'Van - GHI 321 JK',
  },
  {
    id: 'SHP-005',
    product: 'PVC Water Pipe 3/4 inch (9m)',
    emoji: '🔧',
    qty: 15,
    vendor: 'PlumbShop PH',
    destination: 'Port Harcourt',
    status: 'delayed' as const,
    currentStep: 1,
    eta: 'Delayed - ETA TBD',
    driver: 'Emeka Okafor',
    driverVehicle: 'Truck - JKL 654 MN',
  },
];

const LOGISTICS_ALERTS = [
  { id: 'a1', type: 'delay', message: 'SHP-005 held up at Port Harcourt checkpoint', time: '15 min ago' },
  { id: 'a2', type: 'info', message: 'SHP-001 driver approaching Ikeja delivery zone', time: '5 min ago' },
  { id: 'a3', type: 'warning', message: 'Traffic reported on Lagos-Ibadan expressway', time: '30 min ago' },
];

function StepProgress({ currentStep, status }: { currentStep: number; status: string }) {
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
                  isCompleted && status !== 'delayed' && styles.stepDotActive,
                  isCurrent && status !== 'delayed' && styles.stepDotCurrent,
                  status === 'delayed' && i === currentStep && styles.stepDotDelayed,
                ]}
              >
                {isCompleted && status !== 'delayed' ? (
                  <MaterialIcons name="check" size={10} color="#fff" />
                ) : status === 'delayed' && i === currentStep ? (
                  <MaterialIcons name="warning" size={10} color="#fff" />
                ) : null}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && status !== 'delayed' && styles.stepLineActive,
                    status === 'delayed' && i === currentStep - 1 && styles.stepLineActive,
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
  shipment,
}: {
  shipment: typeof SHIPMENTS[0];
}) {
  const statusColor =
    shipment.status === 'active' ? Colors.primary :
    shipment.status === 'completed' ? Colors.success : Colors.error;
  const statusLabel =
    shipment.status === 'active' ? 'In Progress' :
    shipment.status === 'completed' ? 'Completed' : 'Delayed';

  return (
    <View style={[styles.shipCard, { borderLeftColor: statusColor }]}>
      <View style={styles.shipHeader}>
        <View style={styles.shipHeaderLeft}>
          <View style={[styles.shipStatusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.shipId}>{shipment.id}</Text>
          <View style={[styles.shipStatusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.shipStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.shipEta}>{shipment.eta}</Text>
      </View>

      <View style={styles.shipBody}>
        <Text style={styles.shipEmoji}>{shipment.emoji}</Text>
        <View style={styles.shipInfo}>
          <Text style={styles.shipProduct} numberOfLines={1}>{shipment.product}</Text>
          <Text style={styles.shipDetail}>Qty: {shipment.qty} · {shipment.vendor}</Text>
          <Text style={styles.shipDetail}>
            <MaterialIcons name="location-on" size={11} color={Colors.textLight} /> {shipment.destination}
          </Text>
        </View>
      </View>

      <StepProgress currentStep={shipment.currentStep} status={shipment.status} />

      <View style={styles.shipDriver}>
        <MaterialIcons name="local-shipping" size={15} color={Colors.textMedium} />
        <Text style={styles.shipDriverText}>
          {shipment.driver} · {shipment.driverVehicle}
        </Text>
      </View>
    </View>
  );
}

export default function DeliveryDashboardScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const activeCount = SHIPMENTS.filter((s) => s.status === 'active').length;
  const completedCount = SHIPMENTS.filter((s) => s.status === 'completed').length;
  const delayedCount = SHIPMENTS.filter((s) => s.status === 'delayed').length;
  const activeShipments = SHIPMENTS.filter((s) => s.status !== 'completed');

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
            <Text style={styles.mapText}>Live tracking active</Text>
          </View>
        </LinearGradient>

        {/* ─── Status Counters ─── */}
        <View style={styles.counterRow}>
          <View style={[styles.counterCard, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.counterValue}>{activeCount}</Text>
            <Text style={styles.counterLabel}>Active</Text>
          </View>
          <View style={[styles.counterCard, { borderLeftColor: Colors.success }]}>
            <Text style={[styles.counterValue, { color: Colors.success }]}>{completedCount}</Text>
            <Text style={styles.counterLabel}>Completed</Text>
          </View>
          <View style={[styles.counterCard, { borderLeftColor: Colors.error }]}>
            <Text style={[styles.counterValue, { color: Colors.error }]}>{delayedCount}</Text>
            <Text style={styles.counterLabel}>Delayed</Text>
          </View>
        </View>

        {/* ─── Logistics Alerts ─── */}
        {LOGISTICS_ALERTS.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <MaterialIcons name="notifications" size={18} color={Colors.warning} />
              <Text style={styles.alertsTitle}>Logistics Alerts</Text>
              <View style={styles.alertsCount}>
                <Text style={styles.alertsCountText}>{LOGISTICS_ALERTS.length}</Text>
              </View>
            </View>
            {LOGISTICS_ALERTS.map((alert) => {
              const iconName =
                alert.type === 'delay' ? 'error' :
                alert.type === 'warning' ? 'warning' : 'info';
              const iconColor =
                alert.type === 'delay' ? Colors.error :
                alert.type === 'warning' ? Colors.warning : Colors.info;
              return (
                <View key={alert.id} style={styles.alertItem}>
                  <MaterialIcons name={iconName as any} size={16} color={iconColor} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{alert.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ─── Active Shipments ─── */}
        <Text style={styles.sectionTitle}>
          Active Shipments
          <Text style={styles.sectionCount}> ({activeShipments.length})</Text>
        </Text>
        {activeShipments.map((shipment) => (
          <ShipmentCard key={shipment.id} shipment={shipment} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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

  /* ─── Alerts ─── */
  alertsCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    flex: 1,
  },
  alertsCount: {
    backgroundColor: Colors.warning,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  alertsCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertMessage: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '500',
    lineHeight: 17,
  },
  alertTime: {
    fontSize: 10,
    color: Colors.textLight,
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
  stepDotDelayed: {
    backgroundColor: Colors.error,
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
});
