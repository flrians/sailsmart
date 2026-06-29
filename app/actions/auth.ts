'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

const adminClient = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AuthState = { error?: string } | undefined;

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const boatTypeId = formData.get('boatTypeId') as string;

  if (!firstName || !lastName || !email || !password || !boatTypeId) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, boat_type_id: boatTypeId, account_type: 'personal' },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/verify-email');
}

export async function commercialSignUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const companyName = formData.get('companyName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyLogoUrl = (formData.get('companyLogoUrl') as string) || null;

  if (!companyName || !email || !password) {
    return { error: 'Company name, email and password are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
        account_type: 'commercial',
        first_name: companyName,
        last_name: '',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if ((error as any).code === 'user_already_exists') {
      return { error: 'This email is already registered. Please use a different email for your company account.' };
    }
    return { error: error.message || 'Registration failed. Please try again.' };
  }

  if (data.user) {
    // Use admin client to bypass RLS — user is not yet authenticated (email unconfirmed)
    const { error: upsertError } = await adminClient.from('profiles').upsert({
      id: data.user.id,
      account_type: 'commercial',
      company_name: companyName,
      company_logo_url: companyLogoUrl || null,
      first_name: companyName,
      last_name: '',
    });
    if (upsertError) {
      console.error('Profile upsert failed:', upsertError.message);
    }
  }

  redirect('/verify-email');
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
