import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, spacing } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { fetchMatches } from '../../services/messagingService';
import { MatchPreview } from '../../types';
import MatchCard from '../../components/matches/MatchCard';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchesList'>;

export default function MatchesListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMatchesStack();
  const [matches, setMatches] = useState<MatchPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(
    async (showLoading: boolean) => {
      if (!user) return;
      if (showLoading) {
        setLoading(true);
      }
      const data = await fetchMatches(user.id);
      setMatches(data);
      setLoading(false);
      setRefreshing(false);
      await refreshUnreadCount();
    },
    [user, refreshUnreadCount]
  );

  useEffect(() => {
    loadMatches(true);
  }, [loadMatches]);

  useFocusEffect(
    useCallback(() => {
      loadMatches(false);
    }, [loadMatches])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matches.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>Keep swiping to find co-workers!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.headerSubtitle}>{matches.length} conversations</Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.match_id}
        renderItem={({ item }) => (
          <MatchCard
            matchPreview={item}
            onPress={() =>
              navigation.navigate('Chat', {
                matchId: item.match_id,
                otherUser: item.other_user,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: 16,
    color: theme.textSecondary,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
  },
  emptyText: {
    marginTop: spacing[2],
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2DDD6',
    marginLeft: 80,
  },
  listContent: {
    paddingBottom: spacing[6],
  },
});
