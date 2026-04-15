import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { ClientResponseError } from 'pocketbase'

interface AuthContextType {
  user: any
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  simulatedRole: string | null
  setSimulatedRole: (role: string | null) => void
  effectiveRole: string | undefined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null)

  const effectiveRole = simulatedRole || user?.role

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })

    const initAuth = async () => {
      if (!pb.authStore.isValid) {
        try {
          await pb.collection('users').authWithPassword('tozziengenharia@hotmail.com', 'Skip@Pass')
        } catch (error) {
          if (error instanceof ClientResponseError) {
            console.error(
              'Auto login failed with ClientResponseError:',
              error.status,
              error.message,
            )
          } else {
            console.error('Auto login failed', error)
          }
          pb.authStore.clear()
          setUser(null)
        }
      } else {
        setUser(pb.authStore.record)
      }
      setLoading(false)
    }
    initAuth()

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb.collection('users').create({ email, password, passwordConfirm: password })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">Carregando sessão...</div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signUp,
        signIn,
        signOut,
        loading,
        simulatedRole,
        setSimulatedRole,
        effectiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
