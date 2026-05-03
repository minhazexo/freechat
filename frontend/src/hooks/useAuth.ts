import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/api'
import { logError } from '@/lib/errorHandler'

export const useAuth = () => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading,
    setUser,
    setToken,
    setLoading,
    logout: storeLogout,
    updateUser: storeUpdateUser,
    login: storeLogin,
    register: storeRegister,
    anonymousLogin: storeAnonymousLogin,
  } = useAuthStore()

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { data } = await authAPI.me()
        setUser(data.user || data)
      } catch (error) {
        logError('AuthVerify', error)
        // Token invalid/expired: log out and let the user re-authenticate.
        // Avoid auto-refresh loops that can look like "page keeps refreshing".
        storeLogout()
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [token, setLoading, setUser, setToken, storeLogout])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await storeLogin(email, password)
      return data
    },
    [storeLogin]
  )

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      password_confirmation: string,
      interests: string[] = [],
      gender?: string,
      agreedToTerms?: boolean
    ) => {
      const data = await storeRegister(
        username,
        email,
        password,
        password_confirmation,
        interests,
        gender,
        agreedToTerms
      )
      return data
    },
    [storeRegister]
  )

  const anonymousLogin = useCallback(async (interests?: string[], gender?: string, agreedToTerms?: boolean) => {
    const data = await storeAnonymousLogin(interests, gender, agreedToTerms)
    return data
  }, [storeAnonymousLogin])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } finally {
      storeLogout()
    }
  }, [storeLogout])

  const refreshToken = useCallback(async () => {
    const { data } = await authAPI.refresh()
    setToken(data.access_token)
    return data.access_token
  }, [setToken])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAnonymous: user?.is_anonymous ?? false,
    isAdmin: user?.is_admin ?? false,
    login,
    register,
    anonymousLogin,
    logout,
    refreshToken,
    updateUser: storeUpdateUser,
  }
}
