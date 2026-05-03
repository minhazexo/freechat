import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState } from '@/types'
import { api, authAPI } from '@/services/api'
import { disconnectEcho } from '@/services/websocket'
import { logError } from '@/lib/errorHandler'

interface AuthStore extends AuthState {
  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, passwordConfirmation: string, interests?: string[], gender?: string, agreedToTerms?: boolean) => Promise<void>
  anonymousLogin: (interests?: string[], gender?: string, agreedToTerms?: boolean) => Promise<void>
  logout: () => Promise<void>
  verifyToken: () => Promise<boolean>
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      setUser: (user: User | null) => {
  set({ user, isAuthenticated: user !== null })
},

setToken: (token: string | null) => {
  set({ token })
},
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (identifier: string, password: string) => {
        console.info('[Auth] login start', { identifier: identifier.includes('@') ? 'email' : 'username' })
        const response = await authAPI.login(identifier, password)
        const { user, access_token } = response.data
        
        set({
          user,
          token: access_token,
          isAuthenticated: true,
        })
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },

      register: async (username: string, email: string, password: string, passwordConfirmation: string, interests?: string[], gender?: string, agreedToTerms?: boolean) => {
        const response = await api.post('/auth/register', {
          username,
          email,
          password,
          password_confirmation: passwordConfirmation,
          interests,
          gender,
          agreed_to_terms: agreedToTerms,
        })
        const { user, access_token } = response.data
        
        set({
          user,
          token: access_token,
          isAuthenticated: true,
        })
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },

      anonymousLogin: async (interests?: string[], gender?: string, agreedToTerms?: boolean) => {
        const response = await api.post('/auth/anonymous', { 
          interests,
          gender,
          agreed_to_terms: agreedToTerms,
        })
        const { user, access_token } = response.data
        
        set({
          user,
          token: access_token,
          isAuthenticated: true,
        })
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          logError('Logout', error)
        }

        // Disconnect WebSocket before clearing auth state
        disconnectEcho()

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        delete api.defaults.headers.common['Authorization']
      },

      verifyToken: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isLoading: false })
          return false
        }
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/verify')
          
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          })
          
          return true
        } catch (error) {
          logError('VerifyToken', error)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
          
          delete api.defaults.headers.common['Authorization']
          return false
        }
      },

      refreshToken: async () => {
        const response = await api.post('/auth/refresh')
        const { user, access_token } = response.data
        
        set({
          user,
          token: access_token,
          isAuthenticated: true,
        })
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
