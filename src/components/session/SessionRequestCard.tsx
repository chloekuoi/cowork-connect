import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Button from '../common/Button';
import { borderRadius, spacing, theme, touchTarget } from '../../constants';
import { SessionRecord } from '../../types';

type SessionRequestCardProps = {
  session: SessionRecord;
  currentUserId: string;
  otherUserName?: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onLockIn: () => void;
};

function formatStatus(status: SessionRecord['status']) {
  switch (status) {
    case 'pending':
      return 'Session Pending';
    case 'active':
      return 'Invite Accepted';
    case 'declined':
      return 'Session Declined';
    case 'completed':
      return 'Session Completed';
    case 'cancelled':
      return 'Session Cancelled';
    default:
      return 'Session';
  }
}

function formatDateLabel(dateValue?: string | null) {
  if (!dateValue) return 'Today';
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SessionRequestCard({
  session,
  currentUserId,
  otherUserName,
  onAccept,
  onDecline,
  onCancel,
  onLockIn,
}: SessionRequestCardProps) {
  const isInitiator = session.initiated_by === currentUserId;
  const currentUserLocked = isInitiator
    ? !!session.locked_by_initiator_at
    : !!session.locked_by_invitee_at;
  const otherUserLocked = isInitiator
    ? !!session.locked_by_invitee_at
    : !!session.locked_by_initiator_at;
  const scheduledLabel = formatDateLabel(session.scheduled_date || session.session_date);

  const renderActions = () => {
    if (session.status === 'pending') {
      if (isInitiator) {
        return (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            style={styles.button}
          />
        );
      }

      return (
        <View style={styles.row}>
          <Button title="Accept" onPress={onAccept} style={styles.button} />
          <Button
            title="Decline"
            onPress={onDecline}
            variant="secondary"
            style={StyleSheet.flatten([styles.button, styles.buttonSpacer])}
          />
        </View>
      );
    }

    if (session.status === 'active') {
      return (
        <View style={styles.lockRow}>
          <View style={[styles.lockColumn, styles.lockColumnSpacer]}>
            <Text style={styles.lockLabel}>{otherUserName || 'Other'}</Text>
            <View style={[styles.lockPill, otherUserLocked && styles.lockPillActive]}>
              <Text style={[styles.lockText, otherUserLocked && styles.lockTextActive]}>
                Locked in 🔒
              </Text>
            </View>
          </View>
          <View style={styles.lockColumn}>
            <Text style={styles.lockLabel}>You</Text>
            <TouchableOpacity
              onPress={onLockIn}
              disabled={currentUserLocked}
              style={[styles.lockPill, currentUserLocked && styles.lockPillActive]}
            >
              <Text style={[styles.lockText, currentUserLocked && styles.lockTextActive]}>
                Locked in 🔒
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderDescription = () => {
    if (session.status === 'pending') {
      return isInitiator
        ? `Invite sent for ${scheduledLabel}.`
        : `Cowork invite for ${scheduledLabel}.`;
    }

    if (session.status === 'active') {
      return 'Confirm when you both lock in.';
    }

    if (session.status === 'declined') {
      return isInitiator
        ? 'Your invitation was declined.'
        : 'You declined this session.';
    }

    if (session.status === 'completed') {
      return 'Session confirmed.';
    }

    if (session.status === 'cancelled') {
      return isInitiator
        ? 'You cancelled this session.'
        : 'The session was cancelled.';
    }

    return '';
  };

  if (session.status === 'cancelled') {
    return null;
  }

  if (session.status === 'pending' && isInitiator) {
    return (
      <View style={styles.pendingRowCard}>
        <View style={styles.pendingIconBox}>
          <Text style={styles.pendingIcon}>☕️</Text>
        </View>
        <View style={styles.pendingContent}>
          <View style={styles.pendingTitleRow}>
            <Text style={styles.pendingTitle}>Cowork Invite</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </View>
          <Text style={styles.pendingDate}>{scheduledLabel}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.pendingCancelButton}>
          <Text style={styles.pendingCancelText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        session.status === 'active' && styles.activeCard,
        session.status === 'declined' && styles.dimmedCard,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.statusLabel}>{formatStatus(session.status)}</Text>
        <View
          style={[
            styles.statusDot,
            session.status === 'active' && styles.statusDotActive,
            session.status === 'pending' && styles.statusDotPending,
            session.status === 'declined' && styles.statusDotDeclined,
            session.status === 'completed' && styles.statusDotCompleted,
          ]}
        />
      </View>
      <Text style={styles.description}>{renderDescription()}</Text>
      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: theme.highlight,
    marginVertical: spacing[2],
  },
  pendingRowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pendingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#faf3e0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pendingIcon: {
    fontSize: 22,
    color: '#c9a84c',
  },
  pendingContent: {
    flex: 1,
    marginHorizontal: 14,
  },
  pendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#3a3632',
  },
  pendingBadge: {
    marginLeft: 8,
    backgroundColor: '#faf3e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#c9a84c',
  },
  pendingDate: {
    fontSize: 12.5,
    color: '#a09a90',
    marginTop: 2,
  },
  pendingCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f3f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pendingCancelText: {
    color: '#b0a99a',
    fontSize: 16,
    fontWeight: '600',
  },
  activeCard: {
    borderColor: theme.success,
  },
  dimmedCard: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.textMuted,
  },
  statusDotActive: {
    backgroundColor: theme.success,
  },
  statusDotPending: {
    backgroundColor: theme.warning,
  },
  statusDotDeclined: {
    backgroundColor: theme.error,
  },
  statusDotCompleted: {
    backgroundColor: theme.primary,
  },
  statusDotCancelled: {
    backgroundColor: theme.textMuted,
  },
  description: {
    marginTop: spacing[2],
    color: theme.textSecondary,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
  button: {
    minHeight: touchTarget.min,
    flex: 1,
  },
  buttonSpacer: {
    marginLeft: spacing[2],
  },
  lockRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
  lockColumn: {
    flex: 1,
  },
  lockColumnSpacer: {
    marginRight: spacing[3],
  },
  lockLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  lockPill: {
    minHeight: touchTarget.min,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    backgroundColor: theme.surface,
  },
  lockPillActive: {
    backgroundColor: theme.primary,
  },
  lockText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  lockTextActive: {
    color: theme.surface,
  },
});
