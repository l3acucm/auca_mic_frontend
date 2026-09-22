import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ACCESS_KEY, clearTokens, storeTokens } from '../api/client'

interface AuthState {
  isAuthed: boolean
  login: (access: string, refresh: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem(ACCESS_KEY))

  const value = useMemo<AuthState>(
    () => ({
      isAuthed,
      login: (access, refresh) => {
        storeTokens(access, refresh)
        setIsAuthed(true)
      },
      logout: () => {
        clearTokens()
        setIsAuthed(false)
      },
    }),
    [isAuthed],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
