import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, spacing, touchTarget } from '../../constants';

type DateOption = {
  label: string;
  value: string;
};

type InviteComposerCardProps = {
  options: DateOption[];
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

export default function InviteComposerCard({
  options,
  selectedDate,
  onSelectDate,
  onSend,
  onCancel,
}: InviteComposerCardProps) {
  const dateOptions = useMemo(() => {
    const rows: { value: string; dayLabel: string; dateLabel: string }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' });
      const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      rows.push({ value, dayLabel, dateLabel });
    }
    return rows;
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Cowork</Text>
      </View>
      <Text style={styles.title}>Pick a day</Text>
      <Text style={styles.subtitle}>When would you like to cowork?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {dateOptions.map((option) => {
          const selected = option.value === selectedDate;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelectDate(option.value)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillDay, selected && styles.pillDaySelected]}>
                {option.dayLabel}
              </Text>
              <Text style={[styles.pillDate, selected && styles.pillDateSelected]}>
                {option.dateLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 26,
    paddingVertical: 24,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    maxWidth: 360,
    width: '88%',
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5eade',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing[2],
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#6b7f5e',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3a3632',
  },
  subtitle: {
    fontSize: 13,
    color: '#a09a90',
    marginTop: spacing[1],
  },
  pillsRow: {
    marginTop: spacing[4],
    paddingRight: spacing[2],
  },
  pill: {
    width: 56,
    height: 52,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ece8e2',
    backgroundColor: '#faf9f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#6b7f5e',
    borderColor: '#6b7f5e',
    transform: [{ scale: 1.05 }],
  },
  pillDay: {
    fontSize: 12,
    color: '#5a554e',
    fontWeight: '700',
  },
  pillDaySelected: {
    color: '#ffffff',
  },
  pillDate: {
    fontSize: 11,
    color: '#5a554e',
    marginTop: 2,
  },
  pillDateSelected: {
    color: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing[5],
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#6b7f5e',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginLeft: spacing[4],
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cancelButtonText: {
    color: '#a09a90',
    fontSize: 14,
    fontWeight: '600',
  },
});
