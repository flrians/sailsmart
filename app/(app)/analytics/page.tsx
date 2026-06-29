import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, company_name')
    .eq('id', user.id)
    .single();

  if (profile?.account_type !== 'commercial') redirect('/');

  return <AnalyticsClient companyName={profile.company_name ?? ''} />;
}
