import { createClient } from '@/lib/supabase/server';
import RegisterForm from './RegisterForm';

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: boatTypes } = await supabase
    .from('boat_types')
    .select('id, name')
    .eq('available', true)
    .order('name');

  return <RegisterForm boatTypes={boatTypes ?? []} />;
}
