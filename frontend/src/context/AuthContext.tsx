import { createContext, useContext, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import type { LoginRequest, RegisterRequest } from '../types'

interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  email: string
  roles: string[]
  isAdmin: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  )

  const [roles, setRoles] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('roles') ?? '[]')
    } catch {
      return []
    }
  })

  const storeSession = (accessToken: string, userRoles: string[]) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('roles', JSON.stringify(userRoles))
    setToken(accessToken)
    setRoles(userRoles)
  }

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data)
    storeSession(res.accessToken, res.roles ?? [])
  }

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data)
    storeSession(res.accessToken, res.roles ?? [])
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('roles')
    setToken(null)
    setRoles([])
  }

  const email = token ? decodeEmail(token) : ''
  const isAdmin = roles.includes('ADMIN')

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, email, roles, isAdmin, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function decodeEmail(token: string): string {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload)).sub ?? ''
  } catch {
    return ''
  }
}
