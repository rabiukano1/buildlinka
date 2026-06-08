import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Product Details',
          headerBackTitle: 'Back',
          headerTintColor: Colors.primary,
        }}
      />
    </Stack>
  );
}
