import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { CartProvider } from '../contexts/CartContext';
import { SavedProvider } from '../contexts/SavedItemsContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { FeaturedProvider } from '../contexts/FeaturedContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
      <SavedProvider>
      <NotificationProvider>
      <FeaturedProvider>
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
        <Stack.Screen
          name="category/cement"
          options={{
            headerShown: true,
            headerTitle: 'Cement Supply',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/steel-iron"
          options={{
            headerShown: true,
            headerTitle: 'Steel & Iron',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/roofing"
          options={{
            headerShown: true,
            headerTitle: 'Roofing',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/electrical"
          options={{
            headerShown: true,
            headerTitle: 'Electrical',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/plumbing"
          options={{
            headerShown: true,
            headerTitle: 'Plumbing',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/tiles"
          options={{
            headerShown: true,
            headerTitle: 'Tiles',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/timber"
          options={{
            headerShown: true,
            headerTitle: 'Timber',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/equipment"
          options={{
            headerShown: true,
            headerTitle: 'Equipment',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/glass"
          options={{
            headerShown: true,
            headerTitle: 'Glass',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/paint"
          options={{
            headerShown: true,
            headerTitle: 'Paint',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="category/blocks"
          options={{
            headerShown: true,
            headerTitle: 'Blocks',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            headerShown: true,
            headerTitle: 'Cart',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="orders"
          options={{
            headerShown: true,
            headerTitle: 'My Orders',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="saved"
          options={{
            headerShown: true,
            headerTitle: 'Saved Items',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="order-history"
          options={{
            headerShown: true,
            headerTitle: 'Order History',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="my-listings"
          options={{
            headerShown: true,
            headerTitle: 'My Listings',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="add-listing"
          options={{
            headerShown: true,
            headerTitle: 'Add New Listing',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: 'Settings',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            headerTitle: 'Edit Profile',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="my-reviews"
          options={{
            headerShown: true,
            headerTitle: 'My Reviews',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="workers-marketplace"
          options={{
            headerShown: true,
            headerTitle: 'Workers Marketplace',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="my-cart"
          options={{
            headerShown: true,
            headerTitle: 'My Cart',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: true,
            headerTitle: 'Checkout',
            headerBackTitle: 'Cart',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="persona-onboarding"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="vendor-dashboard"
          options={{
            headerShown: true,
            headerTitle: 'Vendor Dashboard',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="help-center"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="my-inventory"
          options={{
            headerShown: true,
            headerTitle: 'My Inventory',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="sales-analytics"
          options={{
            headerShown: true,
            headerTitle: 'Sales Analytics',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="delivery-dashboard"
          options={{
            headerShown: true,
            headerTitle: 'Delivery Dashboard',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="worker-dashboard"
          options={{
            headerShown: true,
            headerTitle: 'Worker Dashboard',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="engineer-dashboard"
          options={{
            headerShown: true,
            headerTitle: 'Engineer Dashboard',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="buyer-dashboard"
          options={{
            headerShown: true,
            headerTitle: 'Buyer Dashboard',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="team"
          options={{
            headerShown: true,
            headerTitle: 'My Team',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="create-work"
          options={{
            headerShown: true,
            headerTitle: 'Create Work',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="popular-vendors"
          options={{
            headerShown: true,
            headerTitle: 'Popular Vendors',
            headerBackTitle: 'Back',
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="projects"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="nearby"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="admin-panel"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="build-project"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="saved-locations"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="privacy-security"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="specifications"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      </FeaturedProvider>
      </NotificationProvider>
      </SavedProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
