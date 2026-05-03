import { useCallback, useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import { subscribeToChat, subscribeToUser, initEcho, disconnectEcho } from '@/services/websocket'
import { Chat, Message } from '@/types'
import { toast } from 'sonner'

const SEARCH_POLL_INTERVAL = 3000 // 3 seconds
const SEARCH_INITIAL_DELAY = 1500 // 1.5 seconds — faster first poll after initial search
const SEARCH_TIMEOUT = 60000 // 60 seconds

export const useChat = () => {
  const { user, token } = useAuthStore()
  const {
    currentChat,
    messages,
    isSearching,
    otherUserTyping,
    setCurrentChat,
    addMessage,
    setMessages,
    setSearching,
    setOtherUserTyping,
    reset,
  } = useChatStore()

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const unsubscribeUserRef = useRef<(() => void) | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize WebSocket connection (reconnects if token changes)
  useEffect(() => {
    if (token) {
      initEcho(token)
    } else {
      disconnectEcho()
    }
  }, [token])

  const currentChatId = currentChat?.id
  const userId = user?.id

  // Clear all search timers
  const clearSearchTimers = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
  }, [])

  // Subscribe to user's private channel for chat:started events
  // This notifies a waiting user when someone else matches with them
  useEffect(() => {
    if (!userId || !token) return

    // Ensure Echo is initialized before subscribing
    initEcho(token)

    unsubscribeUserRef.current = subscribeToUser(userId, {
      onChatStarted: () => {
        // Fetch full chat details from API
        api.get('/chat/active').then(response => {
          if (response.data.chat) {
            setCurrentChat(response.data.chat as Chat)
            setMessages([])
            setSearching(false)
            clearSearchTimers()
            toast.success('Match found!')
          }
        }).catch(console.error)
      },
    })

    return () => {
      if (unsubscribeUserRef.current) {
        unsubscribeUserRef.current()
        unsubscribeUserRef.current = null
      }
    }
  }, [userId, token, setCurrentChat, setMessages, setSearching, clearSearchTimers])

  // Subscribe to chat events when in a chat
  useEffect(() => {
    if (!currentChatId || !userId) return

    unsubscribeRef.current = subscribeToChat(currentChatId, {
      onMessage: (data: unknown) => {
        const messageData = data as Message
        addMessage(messageData)
      },
      onTyping: (data: unknown) => {
        const typingData = data as { is_typing: boolean }
        setOtherUserTyping(typingData.is_typing)
      },
      onEnded: (data: unknown) => {
        const endedData = data as { reason?: string }
        toast.info(`Chat ended${endedData.reason ? `: ${endedData.reason}` : ''}`)
        reset()
      },
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [currentChatId, userId, addMessage, setOtherUserTyping, reset])

  // Poll for active chat while searching (fallback for WebSocket)
  useEffect(() => {
    if (!isSearching) {
      clearSearchTimers()
      return
    }

    const startTime = Date.now()

    const poll = () => {
      if (Date.now() - startTime >= SEARCH_TIMEOUT) {
        setSearching(false)
        toast.info('No match found. Please try again.')
        api.post('/chat/cancel').catch(() => {})
        return
      }

      api.get('/chat/active').then(response => {
        if (response.data.chat) {
          setCurrentChat(response.data.chat as Chat)
          setMessages([])
          setSearching(false)
          clearSearchTimers()
          toast.success('Match found!')
          return
        }
        // Continue polling
        pollingTimerRef.current = setTimeout(poll, SEARCH_POLL_INTERVAL)
      }).catch(() => {
        // Continue polling even on error
        pollingTimerRef.current = setTimeout(poll, SEARCH_POLL_INTERVAL)
      })
    }

    // Start polling after initial delay (shorter than interval for faster feedback)
    pollingTimerRef.current = setTimeout(poll, SEARCH_INITIAL_DELAY)

    // Hard timeout safety net
    searchTimeoutRef.current = setTimeout(() => {
      setSearching(false)
      toast.info('No match found. Please try again.')
      api.post('/chat/cancel').catch(() => {})
    }, SEARCH_TIMEOUT)

    return () => {
      clearSearchTimers()
    }
  }, [isSearching, clearSearchTimers, setCurrentChat, setMessages, setSearching])

  // Check for active chat on mount (handles page refresh while in chat)
  useEffect(() => {
    if (!token || currentChat) return

    api.get('/chat/active').then(response => {
      if (response.data.chat) {
        setCurrentChat(response.data.chat as Chat)
      }
    }).catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const searchChat = useCallback(async (type: 'text' | 'video', interests: string[] = []) => {
    setSearching(true)
    clearSearchTimers()

    try {
      const response = await api.post('/chat/search', { type, interests })
      const data = response.data

      if (data.chat) {
        // Match found immediately or already in a chat
        setCurrentChat(data.chat as Chat)
        setMessages([])
        setSearching(false)
        toast.success('Match found!')
      }
      // If no immediate match, keep isSearching = true
      // Polling effect and WebSocket subscription will handle finding the match
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search for chat')
      setSearching(false)
    }
  }, [setCurrentChat, setMessages, setSearching, clearSearchTimers])

  const cancelSearch = useCallback(async () => {
    clearSearchTimers()
    setSearching(false)

    try {
      await api.post('/chat/cancel')
      toast.info('Search cancelled')
    } catch (error) {
      console.error('Cancel search error:', error)
    }
  }, [setSearching, clearSearchTimers])

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!currentChat) return false

    try {
      if (currentChat.status && currentChat.status !== 'active') {
        toast.info('Chat ended')
        reset()
        return false
      }

      console.info('[Chat] sendMessage', { chatId: currentChat.id, length: content.length })
      const response = await api.post('/chat/message', {
        chat_id: currentChat.id,
        content,
      })
      
      const newMessage = response.data.message as Message
      addMessage(newMessage)
      return true
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = error
      const status = err?.response?.status
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.content?.[0] ||
        err?.message

      if (status === 403 && typeof serverMessage === 'string' && serverMessage.toLowerCase().includes('not active')) {
        toast.info('Chat ended')
        reset()
        return false
      }

      console.error('[Chat] sendMessage failed', { status, serverMessage, data: err?.response?.data })
      toast.error(serverMessage || 'Failed to send message')
      return false
    }
  }, [currentChat, addMessage, reset])

  const sendTyping = useCallback(async (isTyping: boolean) => {
    if (!currentChat) return

    try {
      await api.post('/chat/typing', {
        chat_id: currentChat.id,
        is_typing: isTyping,
      })
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = error
      const status = err?.response?.status
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.chat_id?.[0] ||
        err?.message

      if (status === 403 && typeof serverMessage === 'string' && serverMessage.toLowerCase().includes('not active')) {
        console.warn('[Chat] typing stopped (inactive chat)', { chatId: currentChat.id })
        toast.info('Chat ended')
        reset()
        return
      }

      console.error('Typing error:', error)
    }
  }, [currentChat, reset])

  const handleTyping = useCallback(() => {
    sendTyping(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 2000)
  }, [sendTyping])

  const endChat = useCallback(async (reason?: string) => {
    if (!currentChat) return

    try {
      await api.post('/chat/end', {
        chat_id: currentChat.id,
        reason,
      })
      reset()
      toast.info('Chat ended')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = error
      const status = err?.response?.status
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.chat_id?.[0] ||
        err?.message

      console.error('[Chat] endChat failed', { status, serverMessage, data: err?.response?.data })

      // Common: chat already ended or user no longer participant. Treat as ended client-side.
      if (status === 403 && typeof serverMessage === 'string') {
        const msg = serverMessage.toLowerCase()
        if (msg.includes('not active') || msg.includes('already ended') || msg.includes('not a participant')) {
          toast.info('Chat ended')
          reset()
          return
        }
      }

      toast.error(serverMessage || 'Failed to end chat')
    }
  }, [currentChat, reset])

  const skipChat = useCallback(async () => {
    if (!currentChat) return

    try {
      await api.post('/chat/skip', {
        chat_id: currentChat.id,
      })
      reset()
      toast.info('Skipped to next chat')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = error
      const status = err?.response?.status
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.chat_id?.[0] ||
        err?.message

      console.error('[Chat] skipChat failed', { status, serverMessage, data: err?.response?.data })

      if (status === 403 && typeof serverMessage === 'string') {
        const msg = serverMessage.toLowerCase()
        if (msg.includes('not active') || msg.includes('already ended') || msg.includes('not a participant')) {
          toast.info('Chat ended')
          reset()
          return
        }
      }

      toast.error(serverMessage || 'Failed to skip chat')
    }
  }, [currentChat, reset])

  const addFriend = useCallback(async () => {
    if (!currentChat) return

    try {
      await api.post('/chat/add-friend', {
        chat_id: currentChat.id,
      })
      toast.success('Friend request sent!')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = error
      const status = err?.response?.status
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.chat_id?.[0] ||
        err?.message

      console.error('[Chat] addFriend failed', { status, serverMessage, data: err?.response?.data })

      if (status === 403 && typeof serverMessage === 'string') {
        const msg = serverMessage.toLowerCase()
        if (msg.includes('not active') || msg.includes('already ended') || msg.includes('not a participant')) {
          toast.info('Chat ended')
          reset()
          return
        }
      }

      toast.error(serverMessage || 'Failed to send friend request')
    }
  }, [currentChat, reset])

  const loadMessages = useCallback(async (beforeId?: number) => {
    if (!currentChat) return

    try {
      const params = beforeId ? { before_id: beforeId } : {}
      const response = await api.get(`/chat/messages/${currentChat.id}`, { params })
      const newMessages = response.data.messages as Message[]
      
      if (beforeId) {
        setMessages([...newMessages, ...messages])
      } else {
        setMessages(newMessages)
      }
    } catch (error) {
      console.error('Load messages error:', error)
    }
  }, [currentChat, messages, setMessages])

  return {
    currentChat,
    messages,
    isSearching,
    otherUserTyping,
    searchChat,
    cancelSearch,
    sendMessage,
    handleTyping,
    endChat,
    skipChat,
    addFriend,
    loadMessages,
  }
}
