import type {
  SessionDTO, TabDTO, CreateSessionPayload, CreateTabPayload
} from './types'
import { logger } from './logger'
import { supabase } from '../data/supabaseClient'

const BASE = import.meta.env.VITE_API_BASE

if (!BASE) {
  throw new Error('VITE_API_BASE environment variable is required. Please configure your Supabase URL.')
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    logger.log('🌐 API request:', `${BASE}${path}`, init)
    const token = localStorage.getItem('supabase_token') ?? ''
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        ...(init?.headers || {})
      }
    })
    logger.log('🌐 API response status:', res.status)
    if (!res.ok) {
      const errorText = await res.text()
      logger.error('🌐 API error:', errorText)
      throw new Error(errorText)
    }
    const data = await res.json()
    logger.log('🌐 API response data:', data)
    return data
  } catch (error) {
    logger.error('🌐 API request failed:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Unable to connect to Supabase. Please check your internet connection and try again.`)
    }
    throw error
  }
}

// Main API - Supabase only
export const API = {
  me: async (): Promise<{user: {email: string, photoUrl?: string}}> => {
    try {
      const result = await req('/user_profile?select=*', 'GET' as any) as any[]
      if (result && result.length > 0) {
        const user = result[0] as any
        return { user: { email: user.email, photoUrl: user.photo_url } }
      }
      // If no user found, return default user for development
      return { user: { email: 'developer@tabia.local', photoUrl: undefined } }
    } catch (error) {
      logger.error('❌ Failed to fetch user profile:', error)
      throw new Error('Unable to load user profile. Please try again.')
    }
  },

  listSessions: async (): Promise<SessionDTO[]> => {
    try {
      const sessions = await req('/sessions?select=*&order=updated_at.desc', 'GET' as any) as SessionDTO[]
      return sessions || []
    } catch (error) {
      logger.error('❌ Failed to fetch sessions:', error)
      throw new Error('Unable to load sessions. Please try again.')
    }
  },

  createSession: async (payload: CreateSessionPayload): Promise<SessionDTO> => {
    try {
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        logger.error('❌ Authentication error:', authError)
        throw new Error('User not authenticated. Please sign in first.')
      }

      // First, create the session
      const session = await req('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          owner_id: user.id, // Use real user ID from Supabase Auth
          is_window_session: payload.isWindowSession
        })
      }) as SessionDTO

      // Then, create tabs for this session
      if (payload.tabs && payload.tabs.length > 0) {
        const tabsPromises = payload.tabs.map(tab => 
          req<TabDTO>('/tabs', {
            method: 'POST',
            body: JSON.stringify({
              session_id: session.id,
              title: tab.title || '',
              url: tab.url,
              tab_index: tab.tabIndex,
              window_index: tab.windowIndex
            })
          })
        )
        
        const createdTabs = await Promise.all(tabsPromises)
        session.tabs = createdTabs
      }

      return session
    } catch (error) {
      logger.error('❌ Failed to create session:', error)
      throw new Error('Unable to save session. Please try again.')
    }
  },

  updateSession: async (sessionId: string, updates: Partial<SessionDTO>): Promise<SessionDTO> => {
    try {
      const session = await req(`/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }) as SessionDTO
      return session
    } catch (error) {
      logger.error('❌ Failed to update session:', error)
      throw new Error('Unable to update session. Please try again.')
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await req(`/sessions/${sessionId}`, { method: 'DELETE' })
    } catch (error) {
      logger.error('❌ Failed to delete session:', error)
      throw new Error('Unable to delete session. Please try again.')
    }
  },

  addTab: async (sessionId: string, payload: CreateTabPayload): Promise<TabDTO> => {
    try {
      const tab = await req('/tabs', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          title: payload.title || '',
          url: payload.url,
          tab_index: payload.tabIndex,
          window_index: payload.windowIndex
        })
      }) as TabDTO
      return tab
    } catch (error) {
      logger.error('❌ Failed to add tab:', error)
      throw new Error('Unable to add tab. Please try again.')
    }
  },

  deleteTab: async (sessionId: string, tabId: string): Promise<void> => {
    try {
      await req(`/tabs/${tabId}`, { method: 'DELETE' })
    } catch (error) {
      logger.error('❌ Failed to delete tab:', error)
      throw new Error('Unable to delete tab. Please try again.')
    }
  },

  restoreSession: async (sessionId: string): Promise<void> => {
    try {
      const session = await req(`/sessions/${sessionId}`, 'GET' as any) as SessionDTO
      if (!session || !session.tabs) {
        throw new Error('Session not found or has no tabs')
      }
      const urls = session.tabs.map((tab: TabDTO) => tab.url)
      await chrome.runtime.sendMessage({
        type: 'RESTORE_SESSION',
        urls: urls
      })
    } catch (error) {
      logger.error('❌ Failed to restore session:', error)
      throw new Error('Unable to restore session. Please try again.')
    }
  }
}
