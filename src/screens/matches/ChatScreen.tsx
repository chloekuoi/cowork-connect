import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, spacing } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { fetchMessages, markChatRead, sendMessage, subscribeToMessages } from '../../services/messagingService';
import {
  cancelSession,
  createSession,
  fetchSessionEvents,
  fetchSessionsForMatch,
  lockInSession,
  respondToSession,
  subscribeToSession,
  subscribeToSessionEvents,
} from '../../services/sessionService';
import { ChatTimelineItem, Message, SessionEvent, SessionRecord } from '../../types';
import MessageBubble from '../../components/matches/MessageBubble';
import ChatInputBar from '../../components/matches/ChatInputBar';
import StartSessionButton from '../../components/session/StartSessionButton';
import InviteComposerCard from '../../components/session/InviteComposerCard';
import SessionEventBubble from '../../components/session/SessionEventBubble';
import SessionRequestCard from '../../components/session/SessionRequestCard';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';

type Props = NativeStackScreenProps<MatchesStackParamList, 'Chat'>;

const declinedToastShown: Record<string, boolean> = {};
const cancelledToastShown: Record<string, boolean> = {};

export default function ChatScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMatchesStack();
  const { matchId, otherUser } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [showInviteComposer, setShowInviteComposer] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentlyCompletedSessions, setRecentlyCompletedSessions] = useState<Record<string, number>>(
    {}
  );
  const [shownDeclinedSessions, setShownDeclinedSessions] = useState<Record<string, boolean>>({});
  const [shownCancelledSessions, setShownCancelledSessions] = useState<Record<string, boolean>>({});
  const [shownMissedSessions, setShownMissedSessions] = useState<Record<string, boolean>>({});
  const listRef = useRef<FlatList<ChatTimelineItem>>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async () => {
    const data = await fetchMessages(matchId);
    setMessages(data);
    setLoading(false);
  }, [matchId]);

  const showToast = useCallback((message: string, duration = 3000) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setSessionLoading(true);
    const matchSessions = await fetchSessionsForMatch(matchId);
    const events = await fetchSessionEvents(matchSessions.map((session) => session.id));
    setSessions(matchSessions);
    setSessionEvents(events);
    const now = Date.now();
    let didUpdate = false;
    const updatedRecentlyCompleted: Record<string, number> = { ...recentlyCompletedSessions };
    let didDeclineToast = false;
    let declinedSessionId: string | null = null;
    let didCancelToast = false;
    let cancelledSessionId: string | null = null;
    matchSessions.forEach((session) => {
      if (session.status === 'completed' && session.completed_ack) {
        const completedAt = session.completed_at ? new Date(session.completed_at).getTime() : now;
        if (!updatedRecentlyCompleted[session.id] && now - completedAt <= 60000) {
          updatedRecentlyCompleted[session.id] = now;
          didUpdate = true;
        }
        return;
      }

      if (session.status === 'declined' && !declinedToastShown[session.id]) {
        didDeclineToast = true;
        declinedSessionId = session.id;
      }

      if (
        session.status === 'cancelled' &&
        !session.accepted_at &&
        !cancelledToastShown[session.id]
      ) {
        didCancelToast = true;
        cancelledSessionId = session.id;
      }
    });
    if (didUpdate) {
      setRecentlyCompletedSessions(updatedRecentlyCompleted);
      showToast('Session Completed 🔒❤️');
    }
    if (didDeclineToast && declinedSessionId) {
      declinedToastShown[declinedSessionId] = true;
      setShownDeclinedSessions((prev) => ({ ...prev, [declinedSessionId]: true }));
      showToast('Next Time 🫶🏼');
    }
    if (didCancelToast && cancelledSessionId) {
      cancelledToastShown[cancelledSessionId] = true;
      setShownCancelledSessions((prev) => ({ ...prev, [cancelledSessionId]: true }));
      showToast('Invite cancelled');
    }
    setSessionLoading(false);
  }, [matchId, user, recentlyCompletedSessions, showToast]);

  const markRead = useCallback(async () => {
    if (!user) return;
    await markChatRead(matchId, user.id);
    await refreshUnreadCount();
  }, [matchId, user, refreshUnreadCount]);

  useEffect(() => {
    loadMessages();
    markRead();
    loadSessions();
  }, [loadMessages, markRead, loadSessions]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!user) return () => undefined;

    const unsubscribe = subscribeToMessages(matchId, async (message) => {
      setMessages((prev) => {
        if (prev.find((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      if (message.sender_id !== user.id) {
        await markRead();
      }
    });

    return unsubscribe;
  }, [matchId, user, markRead]);

  useEffect(() => {
    if (!user) return () => undefined;
    if (sessions.length === 0) return () => undefined;

    const unsubscribers = sessions.map((session) =>
      subscribeToSession(session.id, (updated) => {
        setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        if (updated.status === 'completed' && updated.completed_ack) {
          const completedAt = Date.now();
          setRecentlyCompletedSessions((prev) => ({ ...prev, [updated.id]: completedAt }));
          showToast('Session Completed 🔒❤️');
        }
        if (updated.status === 'declined' && !declinedToastShown[updated.id]) {
          declinedToastShown[updated.id] = true;
          setShownDeclinedSessions((prev) => ({ ...prev, [updated.id]: true }));
          showToast('Next Time 🫶🏼');
        }
        if (
          updated.status === 'cancelled' &&
          !updated.accepted_at &&
          !cancelledToastShown[updated.id]
        ) {
          cancelledToastShown[updated.id] = true;
          setShownCancelledSessions((prev) => ({ ...prev, [updated.id]: true }));
          showToast('Invite cancelled');
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessions, user]);

  useEffect(() => {
    if (!user) return () => undefined;
    if (sessions.length === 0) return () => undefined;
    const unsubscribers = sessions.map((session) =>
      subscribeToSessionEvents(session.id, (event) => {
        setSessionEvents((prev) => {
          if (prev.find((item) => item.id === event.id)) {
            return prev;
          }
          return [...prev, event];
        });
      })
    );
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessions, user]);

  const timelineItems = useMemo<ChatTimelineItem[]>(() => {
    const now = Date.now();
    const visibleSessions = sessions.filter((session) => {
      if (session.status === 'completed' && session.completed_ack) {
        return false;
      }
      if (session.status === 'declined') {
        return false;
      }
      if (session.status === 'cancelled') {
        return false;
      }
      return true;
    });

    const sessionItems: ChatTimelineItem[] = visibleSessions.map((session) => ({
      type: 'session',
      session,
    }));
    const messageItems: ChatTimelineItem[] = messages.map((message) => ({
      type: 'message',
      message,
    }));
    const eventItems: ChatTimelineItem[] = sessionEvents
      .filter((event) => {
        if (event.event_type !== 'accepted') return false;
        return !messages.some(
          (message) => new Date(message.created_at).getTime() > new Date(event.created_at).getTime()
        );
      })
      .map((event) => ({
        type: 'event',
        event,
      }));

    const combined = [...sessionItems, ...messageItems, ...eventItems].sort((a, b) => {
      const aDate =
        a.type === 'message'
          ? a.message.created_at
          : a.type === 'event'
            ? a.event.created_at
            : a.session.created_at;
      const bDate =
        b.type === 'message'
          ? b.message.created_at
          : b.type === 'event'
            ? b.event.created_at
            : b.session.created_at;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    return combined.reverse();
  }, [messages, sessions, sessionEvents, recentlyCompletedSessions]);

  useEffect(() => {
    if (timelineItems.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [timelineItems.length]);

  useEffect(() => {
    const missedSession = sessions.find(
      (session) =>
        session.status === 'cancelled' &&
        !!session.accepted_at &&
        session.completed_ack === false &&
        !shownMissedSessions[session.id]
    );
    if (missedSession) {
      showToast('Missed this one 💔');
      setShownMissedSessions((prev) => ({ ...prev, [missedSession.id]: true }));
    }
  }, [sessions, shownMissedSessions, showToast]);

  const handleSend = async (content: string) => {
    if (!user) return;
    const newMessage = await sendMessage(matchId, user.id, content);
    if (!newMessage) {
      Alert.alert('Failed to send', 'Please try again.');
      return;
    }
    setMessages((prev) => {
      if (prev.find((item) => item.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
  };

  const dateOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const label =
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      options.push({ label, value });
    }
    return options;
  }, []);

  const openInviteComposer = () => {
    if (dateOptions.length === 0) return;
    setSelectedDate(dateOptions[0].value);
    setShowInviteComposer(true);
  };

  const handleSendInvite = async () => {
    if (!user || !selectedDate) return;
    const { error } = await createSession(matchId, user.id, selectedDate);
    if (error) {
      Alert.alert('Unable to send invite', error);
      return;
    }
    setShowInviteComposer(false);
    await loadSessions();
  };

  const handleCancelInviteComposer = () => {
    setShowInviteComposer(false);
  };

  const hasMatchSession = sessions.some(
    (session) => session.status === 'pending' || session.status === 'active'
  );

  const handleAcceptSession = async (sessionId: string) => {
    if (!user) return;
    const { error } = await respondToSession(sessionId, user.id, 'accept');
    if (error) {
      Alert.alert('Unable to accept session', error);
      return;
    }
    await loadSessions();
  };

  const handleDeclineSession = async (sessionId: string) => {
    if (!user) return;
    const { error } = await respondToSession(sessionId, user.id, 'decline');
    if (error) {
      Alert.alert('Unable to decline session', error);
      return;
    }
    await loadSessions();
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!user) return;
    const { error } = await cancelSession(sessionId, user.id);
    if (error) {
      Alert.alert('Unable to cancel session', error);
      return;
    }
    await loadSessions();
  };
  const handleLockIn = async (sessionId: string) => {
    if (!user) return;
    const { error } = await lockInSession(sessionId, user.id);
    if (error) {
      Alert.alert('Unable to lock in', error);
      return;
    }
    await loadSessions();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser.name || 'Chat'}</Text>
        <View style={styles.headerRight}>
          {!hasMatchSession && (
            <StartSessionButton
              onPress={openInviteComposer}
              disabled={!user || sessionLoading}
            />
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {showInviteComposer && (
          <InviteComposerCard
            options={dateOptions}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSend={handleSendInvite}
            onCancel={handleCancelInviteComposer}
          />
        )}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : timelineItems.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={timelineItems}
            keyExtractor={(item) =>
              item.type === 'message'
                ? item.message.id
                : item.type === 'event'
                  ? `event-${item.event.id}`
                  : `session-${item.session.id}`
            }
            renderItem={({ item }) =>
              item.type === 'message' ? (
                <MessageBubble message={item.message} isMine={item.message.sender_id === user?.id} />
              ) : item.type === 'event' ? (
                <SessionEventBubble
                  text={`You can now plan coworking details with ${otherUser.name || 'your partner'} 😀`}
                />
              ) : (
                <SessionRequestCard
                  session={item.session}
                  currentUserId={user?.id ?? ''}
                  otherUserName={otherUser.name}
                  onAccept={() => handleAcceptSession(item.session.id)}
                  onDecline={() => handleDeclineSession(item.session.id)}
                  onCancel={() => handleCancelSession(item.session.id)}
                  onLockIn={() => handleLockIn(item.session.id)}
                />
              )
            }
            inverted
            contentContainerStyle={styles.listContent}
          />
        )}

        <ChatInputBar onSend={handleSend} disabled={!user} />
      </KeyboardAvoidingView>

      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={styles.toastBubble}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E2DDD6',
    backgroundColor: theme.surface,
  },
  backButton: {
    paddingRight: spacing[3],
  },
  backText: {
    fontSize: 16,
    color: theme.accent,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing[3],
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: spacing[3],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  toastContainer: {
    position: 'absolute',
    bottom: spacing[10],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastBubble: {
    backgroundColor: theme.text,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  toastText: {
    color: theme.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
