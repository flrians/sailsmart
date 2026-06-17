'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ProfileState = { error?: string; success?: boolean } | undefined;

export async function updateBoatType(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const boatTypeId = formData.get('boatTypeId') as string;
  if (!boatTypeId) return { error: 'Please select a boat type.' };

  const { error } = await supabase
    .from('profiles')
    .update({ boat_type_id: boatTypeId })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  return { success: true };
}
