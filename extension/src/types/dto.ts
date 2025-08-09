// Shared Data Transfer Objects (DTOs) for both v1 and v2 API clients
// These types ensure consistent data shapes between Spring Boot v1 and Supabase v2

export interface UserDTO {
  uid: string;
  email: string;
  name?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface SessionDTO {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  isStarred: boolean;
  isWindowSession: boolean;
  isOwner?: boolean; // Computed field for current user
  createdAt: string;
  updatedAt: string;
  tabs?: TabDTO[];
  collaboratorCount?: number;
}

export interface TabDTO {
  id: string;
  sessionId: string;
  title?: string;
  url: string;
  tabIndex: number;
  windowIndex: number;
  addedByUserId?: string;
  createdAt: string;
}

export interface CollaboratorDTO {
  id: string;
  sessionId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  role: CollaboratorRole;
  addedAt: string;
}

export interface InviteDTO {
  id: string;
  sessionId: string;
  inviteCode: string;
  role: CollaboratorRole;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  expiresAt?: string;
  used: boolean;
}

export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';

// Request DTOs for creating/updating resources
export interface CreateSessionRequest {
  name: string;
  isWindowSession?: boolean;
  tabs?: Omit<TabDTO, 'id' | 'sessionId' | 'createdAt'>[];
}

export interface UpdateSessionRequest {
  name?: string;
  isStarred?: boolean;
}

export interface AddTabRequest {
  title?: string;
  url: string;
  tabIndex?: number;
  windowIndex?: number;
}

export interface UpdateTabRequest {
  title?: string;
  url?: string;
  tabIndex?: number;
  windowIndex?: number;
}

export interface CreateInviteRequest {
  sessionId: string;
  role: CollaboratorRole;
  expiresAt?: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Chrome extension specific types
export interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  windowId?: number;
  index?: number;
  active?: boolean;
  pinned?: boolean;
  favIconUrl?: string;
}

export interface ChromeWindow {
  id?: number;
  tabs?: ChromeTab[];
  focused?: boolean;
  type?: string;
}

// Search and filtering
export interface SearchResult {
  sessions: SessionDTO[];
  tabs: TabDTO[];
  query: string;
  totalResults: number;
}

// Real-time/WebSocket message types
export interface SessionUpdateMessage {
  type: 'SESSION_RENAMED' | 'SESSION_STARRED' | 'SESSION_UNSTARRED' | 'SESSION_DELETED';
  sessionId: string;
  sessionName?: string;
  userId: string;
  userName?: string;
  timestamp: string;
}

export interface TabUpdateMessage {
  type: 'TAB_ADDED' | 'TAB_REMOVED' | 'TAB_UPDATED' | 'TAB_REORDERED';
  sessionId: string;
  tab: TabDTO;
  userId: string;
  userName?: string;
  timestamp: string;
}

export interface PresenceUpdateMessage {
  type: 'USER_JOINED' | 'USER_LEFT' | 'PRESENCE_UPDATE';
  sessionId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  activeUsers: UserPresence[];
  timestamp: string;
}

export interface UserPresence {
  userId: string;
  userName?: string;
  userEmail?: string;
  joinedAt: string;
  lastSeen?: string;
}

// Utility types
export type SortBy = 'name' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface ListOptions {
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
  starred?: boolean;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}
