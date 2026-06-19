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
) {
  const supabase = await createClient();

  await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content });

  await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function generateSessionTitle(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, title')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session || session.title) return;

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(6);

  if (!messages || messages.length === 0) return;

  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a short conversation headline (4–7 words, no trailing punctuation) that summarises what this boat-related conversation is about. Reply with only the headline.',
        },
        { role: 'user', content: conversation },
      ],
      max_tokens: 20,
    }),
  });

  if (!res.ok) return;
  const data = await res.json();
  const title: string | undefined = data.choices?.[0]?.message?.content?.trim();
  if (!title) return;

  await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId);
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

  const sessions = data ?? [];
  const noTitleIds = sessions.filter((s) => !s.title).map((s) => s.id);

  if (noTitleIds.length === 0) return sessions;

  const { data: firstMsgs } = await supabase
    .from('chat_messages')
    .select('session_id, content')
    .in('session_id', noTitleIds)
    .eq('role', 'user')
    .order('created_at', { ascending: true });

  const firstMsgMap = new Map<string, string>();
  for (const msg of firstMsgs ?? []) {
    if (!firstMsgMap.has(msg.session_id)) {
      const raw = msg.content as string;
      firstMsgMap.set(msg.session_id, raw.length > 60 ? raw.slice(0, 57) + '…' : raw);
    }
  }

  return sessions.map((s) => ({
    ...s,
    title: s.title ?? firstMsgMap.get(s.id) ?? null,
  }));
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
