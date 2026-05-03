import type SimplePeer from 'simple-peer'

export interface User {
  id: number
  username: string
  email?: string
  avatar: string
  gender?: 'male' | 'female'
  agreed_to_terms?: boolean
  is_anonymous: boolean
  is_online: boolean
  is_banned: boolean
  ban_reason?: string
  banned_until?: string
  last_active_at?: string
  interests: string[]
  preferences: Record<string, unknown>
  warning_count: number
  is_admin: boolean
  created_at?: string
}

export interface Chat {
  id: number
  type: 'text' | 'video'
  status: 'active' | 'ended' | 'waiting'
  started_at?: string
  ended_at?: string
  end_reason?: string
  interests: string[]
  other_user?: User
  participants?: User[]
  created_at?: string
}

export interface Message {
  id: number
  chat_id: number
  user_id?: number
  username: string
  avatar?: string
  type: 'text' | 'system' | 'image' | 'file'
  content: string
  is_edited: boolean
  edited_at?: string
  is_deleted: boolean
  created_at: string
}

export interface Friend {
  id: number
  user_id: number
  username: string
  avatar: string
  is_online: boolean
  status: 'pending' | 'accepted' | 'rejected'
  is_incoming: boolean
  created_at?: string
}

export interface ChatHistory {
  id: number
  chat_id: number
  type: 'text' | 'video'
  other_user?: User
  started_at?: string
  ended_at?: string
  duration_seconds: number
  duration_formatted: string
  message_count: number
  was_friend_added: boolean
  was_reported: boolean
  rating?: number
  notes?: string
  created_at?: string
}

export interface Report {
  id: number
  reporter?: User
  reported?: User
  chat_id?: number
  type: 'spam' | 'harassment' | 'inappropriate' | 'other'
  reason: string
  description?: string
  evidence?: unknown
  status: 'pending' | 'resolved' | 'dismissed'
  resolver?: User
  resolved_at?: string
  resolution?: string
  created_at?: string
}

export interface ModerationLog {
  id: number
  moderator?: User
  user?: User
  action: string
  reason?: string
  details?: unknown
  ip_address?: string
  created_at?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface ChatState {
  currentChat: Chat | null
  messages: Message[]
  isSearching: boolean
  isTyping: boolean
  otherUserTyping: boolean
}

export interface WebRTCState {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  peer: SimplePeer.Instance | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
}

export interface DashboardStats {
  users: {
    total: number
    online: number
    anonymous: number
    registered: number
    banned: number
    new_today: number
  }
  chats: {
    total: number
    active: number
    text: number
    video: number
    today: number
  }
  reports: {
    total: number
    pending: number
    resolved: number
    dismissed: number
  }
  moderation: {
    logs_today: number
    total_logs: number
  }
}
