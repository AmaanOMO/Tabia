import { supabase } from '../data/supabaseClient';
import { TabDTO, SessionDTO } from '../types/dto';
import { logger } from '../common/logger'

export interface SessionChannelHandlers {
  onTabInserted?: (tab: TabDTO) => void;
  onTabUpdated?: (tab: TabDTO) => void;
  onTabDeleted?: (tabId: string) => void;
  onSessionUpdated?: (patch: Partial<SessionDTO>) => void;
}

/**
 * Subscribe to real-time updates for a specific session
 * Returns an unsubscribe function
 */
export function joinSession(sessionId: string, handlers: SessionChannelHandlers) {
  logger.log(`🔗 Joining real-time session: ${sessionId}`);

  const channel = supabase.channel(`session:${sessionId}`)
    // Tab insertions
    .on('postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'tabs', 
        filter: `session_id=eq.${sessionId}` 
      },
      (payload) => {
        logger.log('📝 Tab inserted:', payload.new);
        const tab = transformTabFromDatabase(payload.new as any);
        handlers.onTabInserted?.(tab);
      }
    )
    // Tab updates
    .on('postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tabs', 
        filter: `session_id=eq.${sessionId}` 
      },
      (payload) => {
        logger.log('✏️ Tab updated:', payload.new);
        const tab = transformTabFromDatabase(payload.new as any);
        handlers.onTabUpdated?.(tab);
      }
    )
    // Tab deletions
    .on('postgres_changes',
      { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'tabs', 
        filter: `session_id=eq.${sessionId}` 
      },
      (payload) => {
        logger.log('🗑️ Tab deleted:', payload.old);
        const tabId = (payload.old as any).id;
        handlers.onTabDeleted?.(tabId);
      }
    )
    // Session updates
    .on('postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'sessions', 
        filter: `id=eq.${sessionId}` 
      },
      (payload) => {
        logger.log('🔄 Session updated:', payload.new);
        const sessionPatch = transformSessionPatchFromDatabase(payload.new as any);
        handlers.onSessionUpdated?.(sessionPatch);
      }
    )
    .subscribe((status) => {
      logger.log(`📡 Session channel status: ${status} for session ${sessionId}`);
    });

  // Return unsubscribe function
  return () => {
    logger.log(`🔌 Leaving real-time session: ${sessionId}`);
    supabase.removeChannel(channel);
  };
}

/**
 * Transform database tab row to TabDTO
 */
function transformTabFromDatabase(dbTab: any): TabDTO {
  return {
    id: dbTab.id,
    sessionId: dbTab.session_id,
    title: dbTab.title,
    url: dbTab.url,
    tabIndex: dbTab.tab_index,
    windowIndex: dbTab.window_index,
    createdAt: dbTab.created_at
  };
}

/**
 * Transform database session row to partial SessionDTO for updates
 */
function transformSessionPatchFromDatabase(dbSession: any): Partial<SessionDTO> {
  return {
    id: dbSession.id,
    name: dbSession.name,
    isStarred: dbSession.is_starred,
    isWindowSession: dbSession.is_window_session,
    updatedAt: dbSession.updated_at
  };
}

/**
 * Subscribe to presence updates for a session
 * Note: This requires Supabase Presence feature
 */
export function joinSessionPresence(sessionId: string, userInfo: { id: string; name?: string; email?: string }) {
  logger.log(`👥 Joining session presence: ${sessionId}`);

  const presenceChannel = supabase.channel(`presence:${sessionId}`, {
    config: {
      presence: {
        key: userInfo.id,
      },
    },
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      logger.log('👥 Presence sync:', state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      logger.log('👋 User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      logger.log('👋 User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          online_at: new Date().toISOString(),
        });
      }
    });

  return () => {
    logger.log(`🔌 Leaving session presence: ${sessionId}`);
    supabase.removeChannel(presenceChannel);
  };
}

/**
 * Broadcast a custom message to all session subscribers
 * Useful for cursor positions, typing indicators, etc.
 */
export function broadcastToSession(sessionId: string, event: string, payload: any) {
  const channel = supabase.channel(`session:${sessionId}`);
  
  channel.send({
    type: 'broadcast',
    event,
    payload
  });
}

/**
 * Subscribe to broadcast messages for a session
 */
export function subscribeToBroadcast(
  sessionId: string, 
  event: string, 
  callback: (payload: any) => void
) {
  logger.log(`📻 Subscribing to broadcast: ${event} for session ${sessionId}`);

  const channel = supabase.channel(`broadcast:${sessionId}:${event}`)
    .on('broadcast', { event }, (payload) => {
      logger.log(`📻 Broadcast received: ${event}`, payload);
      callback(payload);
    })
    .subscribe();

  return () => {
    logger.log(`📻 Unsubscribing from broadcast: ${event} for session ${sessionId}`);
    supabase.removeChannel(channel);
  };
}
