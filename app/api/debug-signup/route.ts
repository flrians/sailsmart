import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signUp({
    email: `debug-${Date.now()}@example.com`,
    password: 'Test1234!',
    options: {
      data: { company_name: 'Debug Co', account_type: 'commercial' },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  return NextResponse.json({
    error: error ? { message: error.message, status: error.status, name: error.name } : null,
    userId: data?.user?.id ?? null,
    session: !!data?.session,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });
}
