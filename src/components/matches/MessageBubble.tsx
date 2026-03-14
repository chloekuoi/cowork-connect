import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, theme } from '../../constants';
import { Message } from '../../types';

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
};

// Only animate messages that arrived in the last 3 seconds — history appears instantly
const ENTER_THRESHOLD_MS = 3000;
const SLIDE_OFFSET = 16;

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isNew = Date.now() - new Date(message.created_at).getTime() < ENTER_THRESHOLD_MS;

  const translateX = useSharedValue(isNew ? (isMine ? SLIDE_OFFSET : -SLIDE_OFFSET) : 0);
  const scale     = useSharedValue(isNew ? 0.88 : 1);
  const opacity   = useSharedValue(isNew ? 0 : 1);

  useEffect(() => {
    if (!isNew) return;
    const easing = Easing.bezier(0.22, 1, 0.36, 1); // ease-out-expo
    translateX.value = withTiming(0, { duration: 280, easing });
    scale.value      = withTiming(1, { duration: 280, easing });
    opacity.value    = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value } as { translateX: number },
      { scale: scale.value } as { scale: number },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        isMine ? styles.containerRight : styles.containerLeft,
        animStyle,
      ]}
    >
      <View style={[styles.bubble, isMine ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.messageText, isMine ? styles.textSent : styles.textReceived]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timestamp, isMine ? styles.timestampRight : styles.timestampLeft]}>
        {time}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '75%',
  },
  containerLeft: {
    alignSelf: 'flex-start',
    marginLeft: spacing[4],
  },
  containerRight: {
    alignSelf: 'flex-end',
    marginRight: spacing[4],
  },
  bubble: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 14,
  },
  bubbleSent: {
    backgroundColor: colors.accentSecondary,
    borderBottomRightRadius: 4,
    shadowColor: colors.accentSecondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleReceived: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textSent: {
    color: colors.accentSecondaryText,
  },
  textReceived: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: spacing[1],
  },
  timestampLeft: {
    textAlign: 'left',
  },
  timestampRight: {
    textAlign: 'right',
  },
});
