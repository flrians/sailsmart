import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
  if (profile?.account_type !== 'commercial') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? '7';
  const days = parseInt(period, 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Boats for this owner
  const { data: boats } = await admin
    .from('charter_boats')
    .select('id, boat_name')
    .eq('owner_id', user.id);

  const boatIds = (boats ?? []).map((b: any) => b.id);
  const boatMap: Record<string, string> = Object.fromEntries((boats ?? []).map((b: any) => [b.id, b.boat_name]));

  if (boatIds.length === 0) {
    return NextResponse.json({ totalSessions: 0, totalMessages: 0, avgMessages: 0, answeredRate: 0, topTopics: [], hourly: [], boatStats: [] });
  }

  // Sessions in period
  const { data: sessions } = await admin
    .from('charter_sessions')
    .select('id, boat_id, started_at')
    .in('boat_id', boatIds)
    .gte('started_at', since);

  const sessionIds = (sessions ?? []).map((s: any) => s.id);

  // Messages
  const { data: messages } = sessionIds.length > 0
    ? await admin.from('charter_messages').select('session_id, role, topic, rag_chunks_used, created_at').in('session_id', sessionIds)
    : { data: [] };

  const msgs = messages ?? [];
  const userMsgs = msgs.filter((m: any) => m.role === 'user');
  const assistantMsgs = msgs.filter((m: any) => m.role === 'assistant');

  const totalSessions = (sessions ?? []).length;
  const totalMessages = userMsgs.length;
  const avgMessages = totalSessions > 0 ? +(totalMessages / totalSessions).toFixed(1) : 0;
  const answered = assistantMsgs.filter((m: any) => (m.rag_chunks_used ?? 0) > 0).length;
  const answeredRate = assistantMsgs.length > 0 ? Math.round((answered / assistantMsgs.length) * 100) : 0;

  // Topic distribution
  const topicCounts: Record<string, number> = {};
  for (const m of userMsgs) {
    if (m.topic) topicCounts[m.topic] = (topicCounts[m.topic] ?? 0) + 1;
  }
  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([topic, count]) => ({ topic, count, pct: totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0 }));

  // Hourly distribution
  const hourlyCounts = Array(24).fill(0);
  for (const m of userMsgs) {
    const h = new Date(m.created_at).getHours();
    hourlyCounts[h]++;
  }
  const hourly = hourlyCounts.map((count, hour) => ({ hour, count }));

  // Per-boat stats
  const sessionsByBoat: Record<string, number> = {};
  const msgsByBoat: Record<string, number> = {};
  for (const s of sessions ?? []) {
    sessionsByBoat[s.boat_id] = (sessionsByBoat[s.boat_id] ?? 0) + 1;
  }
  const sessionToBoat: Record<string, string> = Object.fromEntries((sessions ?? []).map((s: any) => [s.id, s.boat_id]));
  for (const m of userMsgs) {
    const boatId = sessionToBoat[m.session_id];
    if (boatId) msgsByBoat[boatId] = (msgsByBoat[boatId] ?? 0) + 1;
  }

  const boatStats = boatIds.map((id: string) => ({
    id,
    name: boatMap[id],
    sessions: sessionsByBoat[id] ?? 0,
    messages: msgsByBoat[id] ?? 0,
  })).sort((a: any, b: any) => b.sessions - a.sessions);

  // Previous period for trend
  const prevSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000).toISOString();
  const { data: prevSessions } = await admin
    .from('charter_sessions')
    .select('id')
    .in('boat_id', boatIds)
    .gte('started_at', prevSince)
    .lt('started_at', since);
  const prevTotal = (prevSessions ?? []).length;
  const trend = prevTotal > 0 ? Math.round(((totalSessions - prevTotal) / prevTotal) * 100) : null;

  return NextResponse.json({ totalSessions, totalMessages, avgMessages, answeredRate, topTopics, hourly, boatStats, trend, totalBoats: boatIds.length });
}
