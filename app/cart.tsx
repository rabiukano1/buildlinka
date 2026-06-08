import { Stack } from 'expo-router';
import CartView from '../components/CartView';

export default function CartScreen() {
  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Cart' }} />
      <CartView />
    </>
  );
}
