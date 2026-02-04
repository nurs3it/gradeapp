import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { apiClient } from '../api/client'

interface RegisterPayload {
  email: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  setUser: (user: any | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsAuthenticated(true)
        // Fetch user data
        const response = await apiClient.get('/users/me/')
        setUser(response.data)
      } catch (error: any) {
        console.error('Failed to fetch user:', error)
        // Only logout if token is invalid (401), not for network errors
        if (error.response?.status === 401) {
          logout()
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [logout])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login/', { email, password })
      const { access, refresh } = response.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setIsAuthenticated(true)
      
      // Fetch user data
      const userResponse = await apiClient.get('/users/me/')
      setUser(userResponse.data)
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (payload: RegisterPayload) => {
    const { password_confirm, ...body } = payload
    const data = { ...body, password_confirm }
    try {
      const response = await apiClient.post('/auth/register/', data)
      const { user: userData, tokens } = response.data
      if (tokens?.access) {
        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)
        setIsAuthenticated(true)
        setUser(userData)
      }
    } catch (error: any) {
      console.error('Register error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

