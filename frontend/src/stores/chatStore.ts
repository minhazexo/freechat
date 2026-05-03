import { create } from 'zustand'
import { Chat, Message } from '@/types'

interface ChatState {
  currentChat: Chat | null
  messages: Message[]
  isSearching: boolean
  isTyping: boolean
  otherUserTyping: boolean
}

interface ChatStore extends ChatState {
  setCurrentChat: (chat: Chat | null) => void
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  updateMessage: (id: number, updates: Partial<Message>) => void
  deleteMessage: (id: number) => void
  clearMessages: () => void
  setSearching: (searching: boolean) => void
  setTyping: (typing: boolean) => void
  setOtherUserTyping: (typing: boolean) => void
  reset: () => void
}

const initialState: ChatState = {
  currentChat: null,
  messages: [],
  isSearching: false,
  isTyping: false,
  otherUserTyping: false,
}

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  setCurrentChat: (chat) => set({ currentChat: chat }),

  addMessage: (message) => 
    set((state) => {
      // Prevent duplicate messages by checking ID
      if (state.messages.some((msg) => msg.id === message.id)) {
        return state
      }
      return { messages: [...state.messages, message] }
    }),

  setMessages: (messages) => set({ 
    // Ensure uniqueness when setting messages
    messages: messages.filter((msg, index, self) => 
      index === self.findIndex((m) => m.id === msg.id)
    ) 
  }),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  clearMessages: () => set({ messages: [] }),

  setSearching: (searching) => set({ isSearching: searching }),

  setTyping: (typing) => set({ isTyping: typing }),

  setOtherUserTyping: (typing) => set({ otherUserTyping: typing }),

  reset: () => set(initialState),
}))
