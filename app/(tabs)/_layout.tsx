import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function TabLayout() {
  const { isDark, blurIntensity, colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: colors.cardBorder,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="dams"
        options={{ title: 'Dams', tabBarIcon: ({ color, size }) => <Ionicons name="layers" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="trends"
        options={{ title: 'Trends', tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
