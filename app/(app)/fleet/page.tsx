import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FleetClient from './FleetClient';

export default async function FleetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, company_name, company_logo_url')
    .eq('id', user.id)
    .single();

  if (profile?.account_type !== 'commercial') redirect('/');

  const { data: boatTypes } = await supabase
    .from('boat_types')
    .select('id, name')
    .eq('available', true);

  const { data: boats } = await supabase
    .from('charter_boats')
    .select('*, boat_types(name)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <FleetClient
      profile={profile}
      boatTypes={boatTypes ?? []}
      initialBoats={boats ?? []}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ''}
    />
  );
}
