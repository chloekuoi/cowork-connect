import { supabase } from '../../lib/supabase';
import { MatchPreview, Message } from '../types';

type MatchPreviewRow = {
  match_id: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_photo_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export async function fetchMatches(userId: string): Promise<MatchPreview[]> {
  const { data, error } = await supabase.rpc('fetch_match_previews', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  const rows = (data || []) as MatchPreviewRow[];
  return rows.map((row) => ({
    match_id: row.match_id,
    other_user: {
      id: row.other_user_id,
      name: row.other_user_name,
      photo_url: row.other_user_photo_url,
    },
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    unread_count: row.unread_count ?? 0,
  }));
}

export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []) as Message[];
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data as Message;
}

export async function markChatRead(matchId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('mark_chat_read', {
    p_match_id: matchId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error marking chat as read:', error);
    return false;
  }

  return true;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_count', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return typeof data === 'number' ? data : 0;
}

export function subscribeToMessages(
  matchId: string,
  callback: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
