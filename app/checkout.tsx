import KeyboardAwareWrapper from '../components/KeyboardAwareWrapper';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useCart } from '../contexts/CartContext';

const formatPrice = (price: number) => '₦' + price.toLocaleString('en-NG');

const DELIVERY_METHODS = [
  { id: 'standard', label: 'Standard Delivery', eta: '3-5 business days', price: 2500 },
  { id: 'express', label: 'Express Delivery', eta: '1-2 business days', price: 5000 },
  { id: 'pickup', label: 'Pickup Station', eta: 'Ready in 24 hours', price: 0 },
];

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card Payment', icon: 'credit-card', description: 'Pay with debit or credit card' },
  { id: 'bank', label: 'Bank Transfer', icon: 'account-balance', description: 'Transfer to our bank account' },
  { id: 'paystack', label: 'Paystack', icon: 'bolt', description: 'Pay with Paystack' },
];

type StepKey = 'address' | 'delivery' | 'payment';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [expandedStep, setExpandedStep] = useState<StepKey>('address');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const completedSteps: Record<StepKey, boolean> = {
    address: !!addressLine.trim() && !!city.trim() && !!state.trim() && !!phone.trim(),
    delivery: selectedDelivery !== '',
    payment: selectedPayment !== '',
  };

  const allComplete = completedSteps.address && completedSteps.delivery && completedSteps.payment;

  const deliveryCost = DELIVERY_METHODS.find((m) => m.id === selectedDelivery)?.price ?? 0;
  const grandTotal = totalPrice + deliveryCost;

  const toggleStep = (step: StepKey) => {
    setExpandedStep((prev) => (prev === step ? prev : step));
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  const StepSection = ({
    step,
    icon,
    title,
    isComplete,
    children,
  }: {
    step: StepKey;
    icon: string;
    title: string;
    isComplete: boolean;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedStep === step;
    return (
      <View style={[styles.stepCard, isExpanded && styles.stepCardExpanded]}>
        <TouchableOpacity
          style={styles.stepHeader}
          onPress={() => toggleStep(step)}
          activeOpacity={0.7}
        >
          <View style={[styles.stepIndicator, isComplete && styles.stepIndicatorComplete]}>
            {isComplete ? (
              <MaterialIcons name="check" size={16} color="#fff" />
            ) : (
              <MaterialIcons name={icon as any} size={16} color={Colors.textMedium} />
            )}
          </View>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>{title}</Text>
            {isComplete && !isExpanded && (
              <Text style={styles.stepCompleteLabel}>Complete</Text>
            )}
          </View>
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
            color={Colors.textMedium}
          />
        </TouchableOpacity>
        {isExpanded && <View style={styles.stepBody}>{children}</View>}
      </View>
    );
  };

  if (orderPlaced) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Order Placed', headerBackTitle: 'Back', headerTintColor: Colors.primary }} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successText}>
            Your order has been submitted successfully. You will receive a confirmation shortly.
          </Text>
          <View style={styles.successDetails}>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Items</Text>
              <Text style={styles.successDetailValue}>{totalItems}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Total</Text>
              <Text style={styles.successDetailValue}>{formatPrice(grandTotal)}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Delivery</Text>
              <Text style={styles.successDetailValue}>
                {DELIVERY_METHODS.find((m) => m.id === selectedDelivery)?.label}
              </Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successDetailLabel}>Payment</Text>
              <Text style={styles.successDetailValue}>
                {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              clearCart();
              router.push('/(tabs)' as any);
            }}
          >
            <Text style={styles.continueBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
          headerBackTitle: 'Cart',
          headerTintColor: Colors.primary,
        }}
      />
      <KeyboardAwareWrapper
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Step 1: Delivery Address ─── */}
        <StepSection step="address" icon="location-on" title="Delivery Address" isComplete={completedSteps.address}>
          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address Line</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Street address, building, etc."
                placeholderTextColor={Colors.textMuted}
                value={addressLine}
                onChangeText={setAddressLine}
              />
            </View>
          </View>
          <View style={styles.formRowSplit}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                placeholder="City"
                placeholderTextColor={Colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>State</Text>
              <TextInput
                style={styles.formInput}
                placeholder="State"
                placeholderTextColor={Colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>
          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0800 000 0000"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </StepSection>

        {/* ─── Step 2: Delivery Method ─── */}
        <StepSection step="delivery" icon="local-shipping" title="Delivery Method" isComplete={completedSteps.delivery}>
          {DELIVERY_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.optionCard, selectedDelivery === method.id && styles.optionCardSelected]}
              onPress={() => setSelectedDelivery(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.radio, selectedDelivery === method.id && styles.radioSelected]}>
                  {selectedDelivery === method.id && <View style={styles.radioInner} />}
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{method.label}</Text>
                  <Text style={styles.optionEta}>{method.eta}</Text>
                </View>
              </View>
              <Text style={[styles.optionPrice, method.price === 0 && styles.optionPriceFree]}>
                {method.price === 0 ? 'Free' : formatPrice(method.price)}
              </Text>
            </TouchableOpacity>
          ))}
        </StepSection>

        {/* ─── Step 3: Payment Method ─── */}
        <StepSection step="payment" icon="payment" title="Payment Method" isComplete={completedSteps.payment}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.optionCard, selectedPayment === method.id && styles.optionCardSelected]}
              onPress={() => setSelectedPayment(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.radio, selectedPayment === method.id && styles.radioSelected]}>
                  {selectedPayment === method.id && <View style={styles.radioInner} />}
                </View>
                <MaterialIcons name={method.icon as any} size={22} color={Colors.primaryGreen} />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{method.label}</Text>
                  <Text style={styles.optionEta}>{method.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </StepSection>

        {/* ─── Order Summary ─── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.product.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemEmoji}>{item.product.imageEmoji}</Text>
              <View style={styles.summaryItemInfo}>
                <Text style={styles.summaryItemName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.summaryItemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.summaryItemPrice}>
                {formatPrice(item.product.price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>
              {deliveryCost === 0 ? 'Free' : formatPrice(deliveryCost)}
            </Text>
          </View>
          <View style={styles.summaryDividerDark} />
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </View>
      </KeyboardAwareWrapper>

      {/* ─── Fixed Bottom Bar ─── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarLabel}>Total</Text>
          <Text style={styles.bottomBarPrice}>{formatPrice(grandTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, !allComplete && styles.placeOrderBtnDisabled]}
          disabled={!allComplete}
          onPress={handlePlaceOrder}
        >
          <MaterialIcons name="lock" size={18} color="#fff" />
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },

  /* ─── Step Card ─── */
  stepCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepCardExpanded: {
    borderLeftColor: Colors.primary,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorComplete: {
    backgroundColor: Colors.success,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  stepCompleteLabel: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 1,
  },
  stepBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },

  /* ─── Address Form ─── */
  formRow: {
    gap: 12,
  },
  formRowSplit: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textDark,
  },

  /* ─── Option Card (Delivery/Payment) ─── */
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: Colors.primary,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  optionEta: {
    fontSize: 12,
    color: Colors.textLight,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  optionPriceFree: {
    color: Colors.success,
  },

  /* ─── Order Summary ─── */
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  summaryItemEmoji: {
    fontSize: 24,
  },
  summaryItemInfo: {
    flex: 1,
    gap: 1,
  },
  summaryItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  summaryItemQty: {
    fontSize: 11,
    color: Colors.textLight,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 6,
  },
  summaryDividerDark: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textMedium,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textDark,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },

  /* ─── Bottom Bar ─── */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  bottomBarPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 99,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
  },
  placeOrderBtnDisabled: {
    backgroundColor: Colors.border,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  /* ─── Success ─── */
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: Colors.background,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textDark,
  },
  successText: {
    fontSize: 14,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDetailLabel: {
    fontSize: 13,
    color: Colors.textMedium,
  },
  successDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textDark,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 99,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 16,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
