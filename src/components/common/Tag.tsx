import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme, spacing, borderRadius } from '../../constants';

type TagProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'sm' | 'md';
};

export default function Tag({
  label,
  selected = false,
  onPress,
  style,
  size = 'md',
}: TagProps) {
  const Wrapper = onPress ? TouchableOpacity : ({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  );

  if (!onPress) {
    return (
      <Text
        style={[
          styles.base,
          size === 'sm' ? styles.sm : styles.md,
          selected ? styles.selected : styles.unselected,
          style,
        ]}
      >
        {label}
      </Text>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.smText : styles.mdText,
          selected ? styles.selectedText : styles.unselectedText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  selected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  unselected: {
    backgroundColor: theme.surface,
    borderColor: theme.highlight,
  },
  text: {
    fontWeight: '500',
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  selectedText: {
    color: theme.surface,
  },
  unselectedText: {
    color: theme.text,
  },
});
