import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { DiscoveryCard } from '../../types';
import UserProfileView from '../profile/UserProfileView';

interface UserProfileModalProps {
  visible: boolean;
  card: DiscoveryCard | null;
  onDismiss: () => void;
  onSkip: () => void;
  onConnect: () => void;
}

export default function UserProfileModal({
  visible,
  card,
  onDismiss,
  onSkip,
  onConnect,
}: UserProfileModalProps) {
  if (!card) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.container}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Scrollable profile */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <UserProfileView
            profile={card.profile}
            todayIntent={card.intent}
            isOwnProfile={false}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Skip / Connect bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.btnSkip}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSkipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnConnect}
            onPress={onConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.btnConnectText}>Connect</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDefault,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[4],
  },
  bottomSpacer: {
    height: spacing[4],
  },
  // Action bar
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  btnSkip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFF0F0',
    borderWidth: 1.5,
    borderColor: '#F5C2C2',
    minHeight: 54,
  },
  btnSkipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C0392B',
  },
  btnConnect: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accentPrimaryLight,
    borderWidth: 1.5,
    borderColor: '#C4DDD0',
    minHeight: 54,
  },
  btnConnectText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentPrimary,
  },
});
