import { supabase } from '../data/supabaseClient';
import type { User } from '@supabase/supabase-js';



/**
 * Sign in with Google OAuth using hash token flow (proven to work in Chrome extensions)
 */
export async function signInWithGoogle() {
  try {
    // 1) Extension redirect the identity API will watch for
    const redirectTo = chrome.identity.getRedirectURL('provider_cb');

    // 2) Ask Supabase for the provider URL (PKCE is handled by the SDK)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,   // we will open the URL ourselves
        queryParams: { prompt: 'consent' },
      },
    });
    if (error || !data?.url) throw new Error(error?.message ?? 'No URL from Supabase');

    console.log('Auth URL ->', data.url);

    // 3) Open via identity API (Chrome will intercept chromiumapp.org)
    const cbUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: data.url!, interactive: true },
        (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            return reject(chrome.runtime.lastError ?? new Error('No redirect'));
          }
          resolve(redirectedTo);
        }
      );
    });

    console.log('Final cbUrl from launchWebAuthFlow:', cbUrl);

    // 4) Handle either PKCE "code" **or** implicit "access_token"
    const url = new URL(cbUrl);
    const err = url.searchParams.get('error');
    if (err) throw new Error(`OAuth error: ${err}`);

    const code = url.searchParams.get('code');
    if (code) {
      console.log('PKCE code found, exchanging for session...');
      const { error: xErr } = await supabase.auth.exchangeCodeForSession(code);
      if (xErr) throw new Error(`Exchange failed: ${xErr.message}`);
      
      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session after exchange');
      
      console.log('User signed in successfully:', session.user.email);
      return session;
    }

    // Some providers return tokens in the hash instead of a code
    if (url.hash) {
      const hash = new URLSearchParams(url.hash.slice(1));
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      if (access_token && refresh_token) {
        console.log('Implicit tokens found, setting session...');
        const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sErr) throw new Error(`setSession failed: ${sErr.message}`);
        
        // Verify session was created
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session after setSession');
        
        console.log('User signed in successfully:', session.user.email);
        return session;
      }
    }

    throw new Error('No code or tokens in redirect');
    
  } catch (error) {
    // Better error logging
    const showError = (e: unknown) => {
      console.error('Auth error:', e);
      try { console.error('Auth error (json):', JSON.stringify(e)) } catch {}
    };
    showError(error);
    
    throw new Error(`Google sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Sign out failed: ${error.message}`);
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(`Failed to get user: ${error.message}`);
  return user;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  return () => subscription.unsubscribe();
}

/**
 * Upsert current user data into the users table
 * Call this after successful authentication
 */
export async function upsertSelfUser(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const { error } = await supabase
    .from('users')
    .upsert({
      uid: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    }, { 
      onConflict: 'uid' 
    });

  if (error) {
    throw new Error(`Failed to upsert user: ${error.message}`);
  }
}

/**
 * Get user profile from users table
 */
export async function getUserProfile(userId?: string) {
  const targetUserId = userId || (await getCurrentUser())?.id;
  if (!targetUserId) throw new Error('No user ID provided');

  const { data, error } = await supabase
    .from('users')
    .select('uid, email, name, photo_url, created_at')
    .eq('uid', targetUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('User profile not found');
    }
    throw new Error(`Failed to get user profile: ${error.message}`);
  }

  return {
    uid: data.uid,
    email: data.email,
    name: data.name,
    photoUrl: data.photo_url,
    createdAt: data.created_at
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  name?: string;
  photoUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('uid', user.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
