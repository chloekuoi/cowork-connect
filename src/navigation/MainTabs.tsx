import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { NavigatorScreenParams, useFocusEffect } from '@react-navigation/native';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import { theme, spacing } from '../constants';
import MatchesStack, { MatchesStackParamList } from './MatchesStack';
import FriendsStack, { FriendsStackParamList } from './FriendsStack';
import ProfileStack, { ProfileStackParamList } from './ProfileStack';
import { getPendingRequestsCount } from '../services/friendsService';
import { useAuth } from '../context/AuthContext';

export type MainTabsParamList = {
  Discover: undefined;
  Friends: NavigatorScreenParams<FriendsStackParamList> | undefined;
  Matches: NavigatorScreenParams<MatchesStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

function TabIcon({ focused, type }: { focused: boolean; type: 'discover' | 'friends' | 'matches' | 'profile' }) {
  const getIconStyle = () => {
    switch (type) {
      case 'discover':
        return styles.discoverIcon;
      case 'friends':
        return styles.friendsIcon;
      case 'matches':
        return styles.matchesIcon;
      case 'profile':
        return styles.profileIcon;
    }
  };

  return <View style={[styles.iconBase, getIconStyle(), focused && styles.iconFocused]} />;
}

type FriendsTabRootProps = {
  onPendingCountChange: (count: number) => void;
};

function FriendsTabRoot({ onPendingCountChange }: FriendsTabRootProps) {
  const { user } = useAuth();

  const refreshPendingCount = useCallback(async () => {
    if (!user) {
      onPendingCountChange(0);
      return;
    }

    const { count } = await getPendingRequestsCount(user.id);
    onPendingCountChange(count);
  }, [onPendingCountChange, user]);

  useFocusEffect(
    useCallback(() => {
      void refreshPendingCount();
    }, [refreshPendingCount])
  );

  return <FriendsStack />;
}

export default function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendsPendingCount, setFriendsPendingCount] = useState(0);

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
        name="Friends"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} type="friends" />,
          tabBarLabel: 'Friends',
          tabBarBadge: friendsPendingCount > 0 ? friendsPendingCount : undefined,
        }}
      >
        {() => <FriendsTabRoot onPendingCountChange={setFriendsPendingCount} />}
      </Tab.Screen>
      <Tab.Screen
        name="Matches"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} type="matches" />,
          tabBarLabel: 'Chat',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      >
        {() => <MatchesStack onUnreadCountChange={setUnreadCount} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
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
  friendsIcon: {
    borderColor: theme.textMuted,
    borderRadius: 8,
  },
  matchesIcon: {
    borderColor: theme.textMuted,
  },
  profileIcon: {
    borderColor: theme.textMuted,
  },
});
