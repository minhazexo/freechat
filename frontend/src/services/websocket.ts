import Echo from 'laravel-echo'

const PUSHER_KEY = import.meta.env.VITE_PUSHER_APP_KEY || 'chitchat-key'
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1'
const PUSHER_HOST = import.meta.env.VITE_PUSHER_HOST || ''
const PUSHER_PORT = import.meta.env.VITE_PUSHER_PORT || '6001'
const PUSHER_SCHEME = import.meta.env.VITE_PUSHER_SCHEME || 'http'
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000'

const isSelfHosted = PUSHER_HOST.length > 0
const isDebug = import.meta.env.DEV || import.meta.env.VITE_DEBUG_WEBSOCKETS === 'true'

let echo: any = null
let currentToken: string | null = null

// ─── Shared Channel Subscription Manager ────────────────────────────────────
// Prevents double-subscription and premature channel leaving when multiple
// hooks (useChat, useWebRTC) subscribe to the same private/presence channel.
//
// Each call to addChannelListener binds the callback immediately on the Echo
// channel. When the last listener for a channel is removed, the channel is left.

interface ListenerEntry {
  eventName: string
  callback: (data: unknown) => void
}

interface ChannelState {
  refCount: number
  listeners: ListenerEntry[]
}

const channelStates = new Map<string, ChannelState>()

/**
 * Get or create an Echo channel object.
 */
function getOrCreateChannel(channelKey: string, channelType: 'private' | 'presence'): any {
  if (!echo) return null

  if (channelType === 'private') {
    return echo.private(channelKey)
  } else {
    return echo.join(channelKey)
  }
}

/**
 * Register and bind a callback for a named event on a channel.
 * Returns an unsubscribe function that removes ONLY this callback.
 * The underlying Echo channel is left only when the last callback is removed.
 */
function addChannelListener(
  channelKey: string,
  channelType: 'private' | 'presence',
  eventName: string,
  callback: (data: unknown) => void
): () => void {
  let state = channelStates.get(channelKey)

  if (!state) {
    state = { refCount: 0, listeners: [] }
    channelStates.set(channelKey, state)
  }

  // Register this listener
  state.listeners.push({ eventName, callback })
  state.refCount++

  // Bind immediately on the Echo channel
  const channel = getOrCreateChannel(channelKey, channelType)
  if (channel) {
    channel.listen(eventName, callback)
    console.log(`[WebSocket] Bound "${eventName}" on ${channelKey} (refCount: ${state.refCount})`)
  } else {
    console.error(`[WebSocket] Cannot bind "${eventName}" — Echo not initialized or channel unavailable`)
  }

  // Return unsubscribe function
  return () => {
    const s = channelStates.get(channelKey)
    if (!s) return

    // Remove this specific listener entry
    const idx = s.listeners.findIndex(l => l.eventName === eventName && l.callback === callback)
    if (idx !== -1) {
      s.listeners.splice(idx, 1)
    }
    s.refCount--

    // Unbind from Echo channel
    const ch = getOrCreateChannel(channelKey, channelType)
    if (ch) {
      try {
        ch.stopListening(eventName, callback)
      } catch (e) {
        // Fallback: stopListening without callback (older Echo versions)
        try { ch.stopListening(eventName) } catch (_) { /* ignore */ }
      }
    }

    console.log(`[WebSocket] Unbound "${eventName}" from ${channelKey} (refCount: ${s.refCount})`)

    // If no more listeners, leave the channel entirely
    if (s.refCount <= 0) {
      channelStates.delete(channelKey)
      if (echo) {
        try {
          echo.leave(channelKey)
          console.log(`[WebSocket] Left channel ${channelKey} (no more subscribers)`)
        } catch (e) {
          console.warn(`[WebSocket] Error leaving channel ${channelKey}:`, e)
        }
      }
    }
  }
}

// ─── Echo Lifecycle ─────────────────────────────────────────────────────────

export const initEcho = (token: string): any => {
  if (echo && currentToken === token) {
    return echo
  }

  if (echo) {
    echo.disconnect()
    echo = null
    channelStates.clear()
  }

  currentToken = token

  const echoConfig: any = {
    broadcaster: 'pusher',
    key: PUSHER_KEY,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    authEndpoint: `${API_URL}/api/broadcasting/auth`,
  }

  if (isSelfHosted) {
    if (isDebug) {
      console.log('[WebSocket] Self-hosted mode', { wsHost: PUSHER_HOST, wsPort: PUSHER_PORT, scheme: PUSHER_SCHEME, key: PUSHER_KEY })
    }
    echoConfig.key = PUSHER_KEY
    echoConfig.wsHost = PUSHER_HOST
    echoConfig.wsPort = parseInt(PUSHER_PORT)
    echoConfig.wssPort = parseInt(PUSHER_PORT)
    echoConfig.forceTLS = false
    echoConfig.encrypted = false
    echoConfig.disableStats = true
    echoConfig.enabledTransports = ['ws']
    echoConfig.activityTimeout = 60000
    echoConfig.pingTimeout = 30000
  } else {
    if (isDebug) {
      console.log('[WebSocket] Pusher Cloud mode', { cluster: PUSHER_CLUSTER, key: PUSHER_KEY })
    }
    echoConfig.key = PUSHER_KEY
    echoConfig.cluster = PUSHER_CLUSTER
    echoConfig.forceTLS = true
    echoConfig.encrypted = true
  }

  if (isDebug) {
    console.log('[WebSocket] Config:', {
      broadcaster: echoConfig.broadcaster,
      key: echoConfig.key,
      authEndpoint: echoConfig.authEndpoint,
      cluster: echoConfig.cluster,
      wsHost: echoConfig.wsHost,
      wsPort: echoConfig.wsPort,
      forceTLS: echoConfig.forceTLS,
      enabledTransports: echoConfig.enabledTransports,
    })
  }

  echo = new Echo(echoConfig)
  ;(window as any).Echo = echo

  const pusher = echo.connector.pusher

  if (isDebug) {
    console.log('[WebSocket] Attempting to connect...')
    console.log('[WebSocket] Auth endpoint:', echoConfig.authEndpoint)
  }

  pusher.connection.bind('connecting', () => {
    if (isDebug) console.log('[WebSocket] Connecting...')
  })
  pusher.connection.bind('connected', () => {
    if (isDebug) console.log('[WebSocket] Connected! Socket ID:', pusher.connection.socket_id)
  })
  pusher.connection.bind('unavailable', () => {
    console.warn('[WebSocket] Server unavailable')
  })
  pusher.connection.bind('failed', (err: unknown) => {
    console.error('[WebSocket] Connection failed', err)
  })
  pusher.connection.bind('disconnected', () => {
    console.warn('[WebSocket] Disconnected')
  })
  pusher.connection.bind('error', (err: unknown) => {
    console.error('[WebSocket] Error:', err)
    try {
      console.error('[WebSocket] Error JSON:', JSON.stringify(err, null, 2))
    } catch (e) {
      console.error('[WebSocket] Error cannot be stringified')
    }
  })

  return echo
}

export const getEcho = (): any => {
  return echo
}

export const disconnectEcho = (): void => {
  if (echo) {
    echo.disconnect()
    echo = null
    currentToken = null
    channelStates.clear()
  }
}

// ─── Chat Channel (Presence) ────────────────────────────────────────────────

export const subscribeToChat = (
  chatId: number,
  callbacks: {
    onMessage?: (data: unknown) => void
    onTyping?: (data: unknown) => void
    onEnded?: (data: unknown) => void
  }
): (() => void) => {
  const echoInstance = getEcho()
  if (!echoInstance) {
    console.error('[WebSocket] Cannot subscribe to chat — Echo not initialized')
    return () => {}
  }

  const channelKey = `chat.${chatId}`
  const unsubscribers: (() => void)[] = []

  if (callbacks.onMessage) {
    const unsub = addChannelListener(channelKey, 'presence', '.chat:message', callbacks.onMessage)
    unsubscribers.push(unsub)
  }
  if (callbacks.onTyping) {
    const unsub = addChannelListener(channelKey, 'presence', '.chat:typing', callbacks.onTyping)
    unsubscribers.push(unsub)
  }
  if (callbacks.onEnded) {
    const unsub = addChannelListener(channelKey, 'presence', '.chat:ended', callbacks.onEnded)
    unsubscribers.push(unsub)
  }

  return () => {
    unsubscribers.forEach(fn => fn())
  }
}

// ─── User Channel (Private) ─────────────────────────────────────────────────

export const subscribeToUser = (
  userId: number,
  callbacks: {
    onOffer?: (data: unknown) => void
    onAnswer?: (data: unknown) => void
    onIceCandidate?: (data: unknown) => void
    onToggleMedia?: (data: unknown) => void
    onScreenShare?: (data: unknown) => void
    onChatStarted?: (data: unknown) => void
  }
): (() => void) => {
  const echoInstance = getEcho()
  if (!echoInstance) {
    console.error('[WebSocket] Cannot subscribe to user — Echo not initialized')
    return () => {}
  }

  const channelKey = `user.${userId}`
  const unsubscribers: (() => void)[] = []

  if (callbacks.onOffer) {
    const unsub = addChannelListener(channelKey, 'private', '.webrtc:offer', callbacks.onOffer)
    unsubscribers.push(unsub)
  }
  if (callbacks.onAnswer) {
    const unsub = addChannelListener(channelKey, 'private', '.webrtc:answer', callbacks.onAnswer)
    unsubscribers.push(unsub)
  }
  if (callbacks.onIceCandidate) {
    const unsub = addChannelListener(channelKey, 'private', '.webrtc:ice-candidate', callbacks.onIceCandidate)
    unsubscribers.push(unsub)
  }
  if (callbacks.onToggleMedia) {
    const unsub = addChannelListener(channelKey, 'private', '.webrtc:toggle-media', callbacks.onToggleMedia)
    unsubscribers.push(unsub)
  }
  if (callbacks.onScreenShare) {
    const unsub = addChannelListener(channelKey, 'private', '.webrtc:screen-share', callbacks.onScreenShare)
    unsubscribers.push(unsub)
  }
  if (callbacks.onChatStarted) {
    const unsub = addChannelListener(channelKey, 'private', '.chat:started', callbacks.onChatStarted)
    unsubscribers.push(unsub)
  }

  return () => {
    unsubscribers.forEach(fn => fn())
  }
}
