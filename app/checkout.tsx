import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { Field } from '../components/EngineerUI';
import { Colors } from '../constants/Colors';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../hooks/useLocation';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const DELIVERY_METHODS = [
  { id: 'standard', label: 'Standard delivery', eta: '3–5 business days', price: 2500, icon: 'local-shipping' },
  { id: 'express', label: 'Express delivery', eta: '1–2 business days', price: 5000, icon: 'bolt' },
  { id: 'pickup', label: 'Pickup station', eta: 'Ready in 24 hours', price: 0, icon: 'storefront' },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Debit / credit card', icon: 'credit-card', note: "You'll enter card details on a secure page." },
  { id: 'bank', label: 'Bank transfer', icon: 'account-balance', note: "We'll show account details after you place the order." },
  { id: 'paystack', label: 'Paystack', icon: 'payments', note: 'Pay with card, USSD or bank via Paystack.' },
];

const PICKUP_STATION = { name: 'BuildLinka Hub, Ikeja', address: '18 Ikorodu Road, Ikeja, Lagos', hours: 'Mon–Sat, 8am–6pm' };

type PlacedOrder = { id: string; items: number; total: number; delivery: string; eta: string; payment: string };

function Option({ selected, icon, title, subtitle, right, onPress }: {
  selected: boolean; icon: string; title: string; subtitle: string; right?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.option, selected && styles.optionSelected]} onPress={onPress} activeOpacity={0.7} accessibilityState={{ selected }}>
      <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
        <MaterialIcons name={icon as any} size={20} color={selected ? Colors.onPrimary : Colors.onSurfaceVariant} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
      {right !== undefined && <Text style={[styles.optionPrice, right === 'Free' && styles.free]}>{right}</Text>}
      <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={22} color={selected ? Colors.primary : Colors.outlineVariant} />
    </TouchableOpacity>
  );
}

function Section({ step, title, done, children }: { step: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.stepBadge, done && styles.stepBadgeDone]}>
          {done ? <MaterialIcons name="check" size={14} color={Colors.onPrimary} /> : <Text style={styles.stepNum}>{step}</Text>}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { place, loading: locating, permission, refresh: locate } = useLocation({ auto: false });

  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('card');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [wantGps, setWantGps] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  const method = DELIVERY_METHODS.find((m) => m.id === delivery)!;
  const isPickup = delivery === 'pickup';
  const grandTotal = totalPrice + method.price;

  // Fill the form once GPS answers after the user asked for it.
  if (wantGps && place) {
    setWantGps(false);
    setAddress([place.streetNumber, place.street].filter(Boolean).join(' ') || place.name || '');
    setCity(place.city ?? place.subregion ?? '');
    setState(place.region ?? '');
  }

  const errors: Record<string, string> = {};
  if (!isPickup) {
    if (!address.trim()) errors.address = 'Enter your street address';
    if (!city.trim()) errors.city = 'Enter city';
    if (!state.trim()) errors.state = 'Enter state';
  }
  if (phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a valid phone number';
  const missing = Object.keys(errors).length;
  const err = (k: string) => (showErrors ? errors[k] : undefined);

  const useMyLocation = () => {
    setWantGps(true);
    locate();
  };

  const placeOrder = () => {
    if (missing) {
      setShowErrors(true);
      return;
    }
    setOrder({
      id: 'BL-' + Date.now().toString().slice(-6),
      items: totalItems,
      total: grandTotal,
      delivery: method.label,
      eta: method.eta,
      payment: PAYMENT_METHODS.find((p) => p.id === payment)!.label,
    });
    clearCart();
  };

  if (order) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Order placed', headerBackVisible: false, headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background } }} />
        <View style={[styles.success, { paddingBottom: 24 + insets.bottom }]}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check" size={48} color={Colors.onPrimary} />
          </View>
          <Text style={styles.successTitle}>Thank you!</Text>
          <Text style={styles.successText}>Order {order.id} is confirmed. We'll notify you when it ships.</Text>
          <View style={[styles.card, styles.successCard]}>
            {[
              ['Order number', order.id],
              ['Items', String(order.items)],
              ['Delivery', `${order.delivery} · ${order.eta}`],
              ['Payment', order.payment],
              ['Total paid', formatPrice(order.total)],
            ].map(([k, v], i) => (
              <View key={k} style={[styles.row, i > 0 && styles.rowDivider]}>
                <Text style={styles.rowLabel}>{k}</Text>
                <Text style={[styles.rowValue, k === 'Total paid' && styles.rowTotal]}>{v}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.cta} onPress={() => router.replace('/orders' as any)} activeOpacity={0.8}>
            <MaterialIcons name="local-shipping" size={20} color={Colors.onSecondary} />
            <Text style={styles.ctaText}>Track my order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)' as any)} activeOpacity={0.7}>
            <Text style={styles.secondaryText}>Continue shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Checkout', headerTintColor: Colors.primary }} />
        <MaterialIcons name="remove-shopping-cart" size={48} color={Colors.outline} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity style={[styles.cta, styles.emptyCta]} onPress={() => router.replace('/(tabs)/materials' as any)} activeOpacity={0.8}>
          <Text style={styles.ctaText}>Browse materials</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const footer = (
    <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
      <View style={styles.flex}>
        <Text style={styles.footerLabel}>{missing && showErrors ? `${missing} field${missing > 1 ? 's' : ''} to fix` : 'Total'}</Text>
        <Text style={styles.footerTotal}>{formatPrice(grandTotal)}</Text>
      </View>
      <TouchableOpacity style={[styles.placeBtn, !!missing && styles.placeBtnIdle]} onPress={placeOrder} activeOpacity={0.8}>
        <MaterialIcons name="lock" size={18} color={Colors.onSecondary} />
        <Text style={styles.ctaText}>Place order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Checkout', headerBackTitle: 'Cart', headerShadowVisible: false, headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary }} />

      <KeyboardAwareWrapper contentContainerStyle={styles.content} footer={footer}>
        <View style={[styles.card, styles.itemsCard]}>
          <View style={styles.itemsHead}>
            <Text style={styles.itemsTitle}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.link}>Edit cart</Text>
            </TouchableOpacity>
          </View>
          {items.map((item) => (
            <View key={item.product.id} style={styles.item}>
              <View style={styles.itemThumb}>
                <Text style={styles.itemEmoji}>{item.product.imageEmoji}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.itemQty}>{item.quantity} × {formatPrice(item.product.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.product.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <Section step={1} title="Delivery method" done>
          <View style={styles.options}>
            {DELIVERY_METHODS.map((m) => (
              <Option
                key={m.id}
                selected={delivery === m.id}
                icon={m.icon}
                title={m.label}
                subtitle={m.eta}
                right={m.price === 0 ? 'Free' : formatPrice(m.price)}
                onPress={() => setDelivery(m.id)}
              />
            ))}
          </View>
        </Section>

        <Section step={2} title={isPickup ? 'Pickup details' : 'Delivery address'} done={!missing}>
          {isPickup ? (
            <View style={styles.pickup}>
              <MaterialIcons name="storefront" size={22} color={Colors.primary} />
              <View style={styles.flex}>
                <Text style={styles.pickupName}>{PICKUP_STATION.name}</Text>
                <Text style={styles.pickupText}>{PICKUP_STATION.address}</Text>
                <Text style={styles.pickupText}>{PICKUP_STATION.hours}</Text>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.gpsBtn} onPress={useMyLocation} activeOpacity={0.7} disabled={locating}>
                {locating ? <ActivityIndicator size="small" color={Colors.primary} /> : <MaterialIcons name="my-location" size={20} color={Colors.primary} />}
                <Text style={styles.gpsText}>{locating ? 'Finding your address…' : 'Use my current location'}</Text>
              </TouchableOpacity>
              {permission === 'denied' && <Text style={styles.warn}>Location is off. Type your address below.</Text>}
              <Field label="Street address" placeholder="e.g. 42 Awolowo Road" value={address} onChangeText={setAddress} style={err('address') && styles.inputError} />
              {err('address') && <Text style={styles.error}>{err('address')}</Text>}
              <View style={styles.split}>
                <View style={styles.flex}>
                  <Field label="City" placeholder="Ikeja" value={city} onChangeText={setCity} style={err('city') && styles.inputError} />
                </View>
                <View style={styles.flex}>
                  <Field label="State" placeholder="Lagos" value={state} onChangeText={setState} style={err('state') && styles.inputError} />
                </View>
              </View>
            </>
          )}
          <Field
            label="Phone number"
            placeholder="0802 345 6789"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            value={phone}
            onChangeText={setPhone}
            style={err('phone') && styles.inputError}
          />
          {err('phone') && <Text style={[styles.error, styles.errorLast]}>{err('phone')}</Text>}
          <Text style={styles.hint}>{isPickup ? "We'll text you when your order is ready." : 'The driver will call this number on arrival.'}</Text>
        </Section>

        <Section step={3} title="Payment" done>
          <View style={styles.options}>
            {PAYMENT_METHODS.map((p) => (
              <Option key={p.id} selected={payment === p.id} icon={p.icon} title={p.label} subtitle={p.note} onPress={() => setPayment(p.id)} />
            ))}
          </View>
        </Section>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Subtotal</Text>
            <Text style={styles.rowValue}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery</Text>
            <Text style={[styles.rowValue, method.price === 0 && styles.free]}>{method.price === 0 ? 'Free' : formatPrice(method.price)}</Text>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.secure}>
          <MaterialIcons name="verified-user" size={16} color={Colors.outline} />
          <Text style={styles.secureText}>Payments are encrypted. You won't be charged until your order is confirmed.</Text>
        </View>
      </KeyboardAwareWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  content: { padding: 16, paddingBottom: 24 },
  flex: { flex: 1 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#1b1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  link: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  itemsCard: { marginBottom: 24 },
  itemsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemsTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.surfaceVariant + '80', alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 22 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  itemQty: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },

  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  stepBadgeDone: { backgroundColor: Colors.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceVariant },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },

  options: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.divider },
  optionSelected: { borderColor: Colors.primary, borderWidth: 2, padding: 11, backgroundColor: Colors.greenTint + '33' },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceVariant + '99', alignItems: 'center', justifyContent: 'center' },
  optionIconSelected: { backgroundColor: Colors.primary },
  optionTitle: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  optionSub: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  optionPrice: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  free: { color: Colors.primary },

  pickup: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 8, backgroundColor: Colors.greenTint + '4d', marginBottom: 16 },
  pickupName: { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  pickupText: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '40', backgroundColor: Colors.greenTint + '4d', marginBottom: 16 },
  gpsText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  warn: { fontSize: 13, color: Colors.tertiary, marginTop: -8, marginBottom: 12 },
  split: { flexDirection: 'row', gap: 12 },
  inputError: { borderColor: Colors.error },
  error: { fontSize: 12, fontWeight: '500', color: Colors.error, marginTop: -10, marginBottom: 12 },
  errorLast: { marginBottom: 4 },
  hint: { fontSize: 13, color: Colors.outline, marginTop: -8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: 6, paddingTop: 12 },
  rowLabel: { fontSize: 14, color: Colors.onSurfaceVariant },
  rowValue: { fontSize: 14, fontWeight: '600', color: Colors.onSurface, flexShrink: 1, textAlign: 'right', marginLeft: 16 },
  rowTotal: { fontSize: 16, fontWeight: '700' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  totalValue: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },

  secure: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 8 },
  secureText: { flex: 1, fontSize: 12, color: Colors.outline, lineHeight: 16 },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 12, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.divider },
  footerLabel: { fontSize: 12, color: Colors.outline },
  footerTotal: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  placeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 24, borderRadius: 999, backgroundColor: Colors.secondary },
  placeBtnIdle: { opacity: 0.6 },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', height: 52, borderRadius: 999, backgroundColor: Colors.secondary, marginTop: 24 },
  ctaText: { fontSize: 16, fontWeight: '600', color: Colors.onSecondary },
  secondaryBtn: { alignSelf: 'stretch', height: 52, borderRadius: 999, borderWidth: 1, borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryText: { fontSize: 16, fontWeight: '600', color: Colors.primary },

  success: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '700', color: Colors.onSurface },
  successText: { fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: 6, lineHeight: 22 },
  successCard: { alignSelf: 'stretch', marginTop: 24 },

  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  emptyCta: { alignSelf: 'auto', paddingHorizontal: 32, marginTop: 8 },
});
