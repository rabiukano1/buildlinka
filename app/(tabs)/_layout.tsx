import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.outlineVariant,
          borderTopWidth: 1,
          paddingTop: 8,
          height: 65,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.onPrimary,
          fontSize: 20,
        },
        headerTintColor: Colors.onPrimary,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'BuildLinka',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: 'Materials',
          headerTitle: 'Materials',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory-2" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: 'Workers',
          headerTitle: 'Professionals',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
