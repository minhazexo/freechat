import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Get token helper
const getToken = () => {
  const storage = localStorage.getItem('auth-storage')
  if (!storage) return null
  
  try {
    const parsed = JSON.parse(storage)
    return parsed.state?.token || null
  } catch {
    return null
  }
}

// Update token in both zustand localStorage and in-memory state
const updateStoredToken = (newToken: string) => {
  const storage = localStorage.getItem('auth-storage')
  if (storage) {
    try {
      const parsed = JSON.parse(storage)
      parsed.state.token = newToken
      localStorage.setItem('auth-storage', JSON.stringify(parsed))
    } catch (e) {
      console.error('[API] Failed to update stored token:', e)
    }
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add Socket ID for Laravel Broadcasting toOthers()
    const socketId = (window as any).Echo?.socketId()
    if (socketId) {
      config.headers['X-Socket-ID'] = socketId
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const requestUrl: string = originalRequest?.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/') || requestUrl.includes('/auth/')

    // Never attempt refresh for auth endpoints (login/register/refresh/etc).
    // Otherwise a normal "invalid credentials" becomes a refresh loop.
    if (status === 401 && isAuthEndpoint) {
      console.warn('[API] 401 on auth endpoint (no refresh):', requestUrl)
      return Promise.reject(error)
    }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = getToken()
        if (!refreshToken) {
          console.warn('[API] 401 with no token; skipping refresh for:', requestUrl)
          return Promise.reject(error)
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` }
          }
        )

        const { access_token } = response.data

        // Update token in localStorage
        updateStoredToken(access_token)

        // Sync with zustand store if available
        try {
          const storage = localStorage.getItem('auth-storage')
          if (storage) {
            const parsed = JSON.parse(storage)
            // The zustand persist middleware will pick up the new token
            // on next state hydration, but we also set the header immediately
            parsed.state.token = access_token
            localStorage.setItem('auth-storage', JSON.stringify(parsed))
          }
        } catch (e) {
          console.error('[API] Failed to sync token with zustand:', e)
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`

        return api(originalRequest)

      } catch (refreshError) {
        console.error('[API] Token refresh failed; clearing auth state')
        localStorage.removeItem('auth-storage')
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)


// AUTH API
export const authAPI = {

  login: (identifier: string, password: string) =>
  api.post('/auth/login', {
    email: identifier.includes('@') ? identifier : undefined,
    username: identifier.includes('@') ? undefined : identifier,
    password
  }),

  register: (
    username: string,
    email: string,
    password: string,
    password_confirmation: string,
    interests: string[] = []
  ) =>
    api.post('/auth/register', {
      username,
      email,
      password,
      password_confirmation,
      interests
    }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: () => api.post('/auth/refresh'),

  anonymous: (interests?: string[]) => api.post('/auth/anonymous', { interests }),
}

export default api
