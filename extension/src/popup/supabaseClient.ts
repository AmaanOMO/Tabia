// src/popup/supabaseClient.ts - Popup-safe version
import { createClient } from '@supabase/supabase-js';
import { chromeStorageAdapter } from '../data/supaStorage';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: chromeStorageAdapter,
      storageKey: 'tabia.supabase.auth',
    }
  }
);
