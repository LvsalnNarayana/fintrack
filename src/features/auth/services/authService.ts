import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

const AUTH_EMAIL_DOMAIN = 'users.fintrack.app';

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

const getAuthEmail = (username: string): string => {
  const normalizedUsername = normalizeUsername(username);
  if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
    throw new Error('Username must be 3-30 characters and use only letters, numbers, or underscores.');
  }
  return `${normalizedUsername}@${AUTH_EMAIL_DOMAIN}`;
};

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signInWithPassword(username: string, password: string): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const email = getAuthEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  },

  async signUp(username: string, password: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const normalizedUsername = normalizeUsername(username);
    const { error } = await supabase.auth.signUp({
      email: getAuthEmail(normalizedUsername),
      password,
      options: {
        data: { username: normalizedUsername },
      },
    });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

