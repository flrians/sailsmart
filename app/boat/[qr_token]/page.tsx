import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import GuestBoatClient from './GuestBoatClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function GuestBoatPage({ params }: { params: Promise<{ qr_token: string }> }) {
  const { qr_token } = await params;

  const { data: boat } = await supabase
    .from('charter_boats')
    .select('*, boat_types(id, name), profiles(company_name, company_logo_url)')
    .eq('qr_token', qr_token)
    .single();

  if (!boat) notFound();

  // Create session
  const { data: session } = await supabase
    .from('charter_sessions')
    .insert({ boat_id: boat.id })
    .select('id')
    .single();

  return (
    <GuestBoatClient
      boat={boat}
      sessionId={session?.id ?? null}
      qrToken={qr_token}
    />
  );
}
