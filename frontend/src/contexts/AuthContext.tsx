import React, { createContext, useContext, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (_email: string, _password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

interface AuthProviderProps {
  readonly children: React.ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (_email: string, _password: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual authentication
      // For now, simulate login
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUser({
        id: '1',
        email: _email,
        name: _email.split('@')[0],
      })
    } catch {
      throw new Error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
  }

  const contextValue = React.useMemo(
    () => ({ user, login, logout, isLoading }),
    [user, isLoading, login, logout]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
