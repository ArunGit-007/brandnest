'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * Returns a function that resolves the current Supabase access token.
 * Used to authenticate client-side calls to /api/ai/generate.
 */
export function useAiSession() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return async function getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Not authenticated. Please log in again.');
    return token;
  };
}
