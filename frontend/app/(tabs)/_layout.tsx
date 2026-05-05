import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LayoutDashboard, LayoutGrid, Sparkles, User } from 'lucide-react-native';
import { theme } from '../../src/theme';

// Defined at module scope so React doesn't recreate the component on every render
// (prevents subtle hook-count and remount issues in descendants).
const TabBarBlur = () => (
  <BlurView
    intensity={Platform.OS === 'ios' ? 70 : 90}
    tint="dark"
    style={StyleSheet.absoluteFill}
  />
);

const DashboardIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View testID="tab-dashboard">
    <LayoutDashboard size={focused ? 22 : 20} color={color} strokeWidth={2} />
  </View>
);

const AppsIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View testID="tab-apps">
    <LayoutGrid size={focused ? 22 : 20} color={color} strokeWidth={2} />
  </View>
);

const InsightsIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View testID="tab-insights">
    <Sparkles size={focused ? 22 : 20} color={color} strokeWidth={2} />
  </View>
);

const ProfileIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <View testID="tab-profile">
    <User size={focused ? 22 : 20} color={color} strokeWidth={2} />
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarBackground: TabBarBlur,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: DashboardIcon }}
      />
      <Tabs.Screen
        name="apps"
        options={{ title: 'Apps', tabBarIcon: AppsIcon }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: 'Insights', tabBarIcon: InsightsIcon }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ProfileIcon }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,10,0.6)',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: 76,
    paddingBottom: 14,
  },
});
