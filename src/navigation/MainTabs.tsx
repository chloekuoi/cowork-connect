import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/native';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { theme, spacing } from '../constants';
import MatchesStack, { MatchesStackParamList } from './MatchesStack';

export type MainTabsParamList = {
  Discover: undefined;
  Matches: NavigatorScreenParams<MatchesStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Simple icon components (circles with different fills for now)
function TabIcon({ focused, type }: { focused: boolean; type: 'discover' | 'matches' | 'profile' }) {
  const getIconStyle = () => {
    switch (type) {
      case 'discover':
        return styles.discoverIcon;
      case 'matches':
        return styles.matchesIcon;
      case 'profile':
        return styles.profileIcon;
    }
  };

  return (
    <View
      style={[
        styles.iconBase,
        getIconStyle(),
        focused && styles.iconFocused,
      ]}
    />
  );
}

export default function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} type="discover" />,
        }}
      />
      <Tab.Screen
        name="Matches"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} type="matches" />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      >
        {() => <MatchesStack onUnreadCountChange={setUnreadCount} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} type="profile" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.surface,
    borderTopColor: '#E2DDD6',
    borderTopWidth: 1,
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
    height: 80,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: spacing[1],
  },
  iconBase: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  iconFocused: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  discoverIcon: {
    borderColor: theme.textMuted,
    borderRadius: 6,
  },
  matchesIcon: {
    borderColor: theme.textMuted,
  },
  profileIcon: {
    borderColor: theme.textMuted,
  },
});
