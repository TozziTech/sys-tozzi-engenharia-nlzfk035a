import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { ClientResponseError } from 'pocketbase'

interface AuthContextType {
  user: any
  signUp: (data: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  loading: boolean
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

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })

    const initAuth = async () => {
      if (pb.authStore.isValid) {
        try {
          const authData = await pb.collection('users').authRefresh()
          if (authData.record.status === 'Pendente' || authData.record.status === 'Inativo') {
            pb.authStore.clear()
            setUser(null)
          } else {
            setUser(authData.record)
          }
        } catch (error) {
          console.error('Failed to refresh auth', error)
          pb.authStore.clear()
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    initAuth()

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (data: any) => {
    try {
      const tempCodigo = 'TEMP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      await pb.collection('users').create({
        ...data,
        status: 'Pendente',
        role: 'Visitante',
        codigo: data.codigo || tempCodigo,
      })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      if (authData.record.status === 'Pendente') {
        pb.authStore.clear()
        return {
          error: {
            message:
              'Sua conta está aguardando aprovação. Você receberá um aviso assim que for liberada.',
          },
        }
      }
      if (authData.record.status === 'Inativo') {
        pb.authStore.clear()
        return { error: { message: 'Sua conta está inativa. Contate o administrador.' } }
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
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
        requestPasswordReset,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
