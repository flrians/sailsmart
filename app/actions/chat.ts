'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createSession(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('boat_type_id')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id, boat_type_id: profile?.boat_type_id ?? null })
    .select('id')
    .single();

  if (error) return null;
  return data.id;
}

export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  isFirst = false,
) {
  const supabase = await createClient();

  await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content });

  // Set session title from the first user message
  if (isFirst && role === 'user') {
    const title = content.length > 60 ? content.slice(0, 57) + '…' : content;
    await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  } else {
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }
}

export async function getSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return data ?? [];
}

export async function getSessionMessages(sessionId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return data ?? [];
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  await supabase.from('chat_sessions').delete().eq('id', sessionId);
  revalidatePath('/history');
}
