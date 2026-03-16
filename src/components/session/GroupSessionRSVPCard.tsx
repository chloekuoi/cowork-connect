import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { borderRadius, colors, spacing, theme } from '../../constants';
import { GroupSession, GroupSessionRsvp } from '../../types';

type GroupSessionRSVPCardProps = {
  session: GroupSession;
  rsvps: GroupSessionRsvp[];
  memberCount: number;
  currentUserId: string;
  proposedByName: string;
  onRsvp: (response: 'yes' | 'no') => void;
  onCancel: () => void;
};

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function GroupSessionRSVPCard({
  session,
  rsvps,
  memberCount,
  currentUserId,
  proposedByName,
  onRsvp,
  onCancel,
}: GroupSessionRSVPCardProps) {
  if (session.status === 'cancelled') {
    return null;
  }

  const myRsvp = rsvps.find((item) => item.user_id === currentUserId) || null;
  const yesCount = rsvps.filter((item) => item.response === 'yes').length;
  const noCount = rsvps.filter((item) => item.response === 'no').length;
  const pendingCount = Math.max(0, memberCount - yesCount - noCount);
  const countText =
    noCount === 0
      ? `${yesCount} going · ${memberCount - yesCount} haven't replied`
      : `${yesCount} going · ${noCount} not going · ${pendingCount} pending`;
  const isProposer = session.proposed_by === currentUserId;

  if (session.status === 'completed') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>☕ Group Session</Text>
        <Text style={styles.date}>{formatDateLabel(session.scheduled_date)}</Text>
        <View style={[styles.responsePill, styles.successPill]}>
          <Text style={[styles.responseText, styles.successText]}>Session confirmed 🎉</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>☕ Group Session</Text>
      <Text style={styles.date}>{formatDateLabel(session.scheduled_date)}</Text>
      <Text style={styles.subtitle}>Proposed by {proposedByName}</Text>
      <Text style={styles.countText}>{countText}</Text>

      {myRsvp ? (
        <View style={styles.respondedRow}>
          <View
            style={[
              styles.responsePill,
              myRsvp.response === 'yes' ? styles.successPill : styles.errorPill,
            ]}
          >
            <Text
              style={[
                styles.responseText,
                myRsvp.response === 'yes' ? styles.successText : styles.errorText,
              ]}
            >
              {myRsvp.response === 'yes' ? "You're going ✓" : "You can't make it ✗"}
            </Text>
          </View>
          {isProposer ? (
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => onRsvp('yes')} style={[styles.actionButton, styles.yesButton]}>
            <Text style={[styles.actionText, styles.yesText]}>Yes ✓</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onRsvp('no')} style={[styles.actionButton, styles.noButton]}>
            <Text style={[styles.actionText, styles.noText]}>No ✗</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    padding: spacing[4],
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  date: {
    marginTop: spacing[1],
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: 13,
    color: theme.textSecondary,
  },
  countText: {
    marginTop: spacing[2],
    fontSize: 13,
    color: theme.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  yesButton: {
    backgroundColor: colors.statusConfirmedBg,
    borderColor: colors.accentSuccess,
    marginRight: spacing[2],
  },
  noButton: {
    backgroundColor: '#FBEDEA',
    borderColor: theme.error,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  yesText: {
    color: colors.statusConfirmedText,
  },
  noText: {
    color: theme.error,
  },
  respondedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  responsePill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  successPill: {
    backgroundColor: colors.statusConfirmedBg,
  },
  errorPill: {
    backgroundColor: '#FBEDEA',
  },
  responseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  successText: {
    color: colors.statusConfirmedText,
  },
  errorText: {
    color: theme.error,
  },
  cancelButton: {
    minHeight: 36,
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.error,
  },
});
