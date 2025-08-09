import { supabase } from '../data/supabaseClient';
import type { User } from '@supabase/supabase-js';

/**
 * Sign in with Google using Supabase Auth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  
  if (error) throw new Error(`Google sign-in failed: ${error.message}`);
  return data;
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
