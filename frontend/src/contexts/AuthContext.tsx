import React, { createContext, useContext, useState, useEffect } from 'react'
import axios, { AxiosError } from 'axios'
import { UserRole } from '../../../shared/enums'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  login: (_email: string, _password: string) => Promise<void>
  register: (_email: string, _password: string, _name: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

interface AuthProviderProps {
  readonly children: React.ReactNode
}

interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
  }
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      validateToken()
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateToken = async () => {
    try {
      const response = await axios.get<AuthResponse>(`${API_BASE_URL}/auth/me`)
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user)
      } else {
        localStorage.removeItem('authToken')
        delete axios.defaults.headers.common['Authorization']
      }
    } catch {
      // Token validation failed, clear auth state
      localStorage.removeItem('authToken')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      })

      if (response.data.success && response.data.data) {
        const { user: userData, token } = response.data.data
        localStorage.setItem('authToken', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(userData)
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        name,
      })

      if (response.data.success && response.data.data) {
        const { user: userData, token } = response.data.data
        localStorage.setItem('authToken', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(userData)
      } else {
        throw new Error(response.data.error || 'Registration failed')
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const isAuthenticated = user !== null
  const isAdmin = user?.role === UserRole.ADMIN

  const contextValue = React.useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      isLoading,
      isAuthenticated,
      isAdmin,
    }),
    [user, isLoading, isAuthenticated, isAdmin]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
