import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export async function getSession() {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated() {
  const user = await getUser();
  return !!user;
}

export async function isAdmin(email?: string) {
  if (!email) {
    const user = await getUser();
    email = user?.email;
  }

  if (!email) return false;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .single();

  return !!data && !error;
}
