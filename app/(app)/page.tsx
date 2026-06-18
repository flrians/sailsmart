import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getSessionMessages } from '@/app/actions/chat';
import ChatClient from './ChatClient';

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const sessionId = params.session ?? null;

  const [{ data: { user } }, { data: profileData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('boat_type_id, boat_types(name)').single(),
  ]);

  const boatTypeId = (profileData as any)?.boat_type_id as string | null ?? null;
  const boatName = (profileData as any)?.boat_types?.name as string ?? 'your boat';

  let hasManual = false;
  if (boatTypeId) {
    const { count } = await adminClient
      .from('manual_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('boat_type_id', boatTypeId);
    hasManual = (count ?? 0) > 0;
  }

  // Load existing messages if resuming a session
  let initialMessages: { id: string; role: string; content: string }[] = [];
  if (sessionId) {
    initialMessages = await getSessionMessages(sessionId);
  }

  return (
    <ChatClient
      key={sessionId ?? 'new'}
      hasManual={hasManual}
      boatName={boatName}
      sessionId={sessionId}
      initialMessages={initialMessages}
    />
  );
}
