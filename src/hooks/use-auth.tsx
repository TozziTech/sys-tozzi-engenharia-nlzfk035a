import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { ClientResponseError } from 'pocketbase'

interface AuthContextType {
  user: any
  originalUser: any
  roleOverride: string | null
  setRoleOverride: (role: string | null) => void
  signUp: (data: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  confirmPasswordReset: (
    token: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<{ error: any }>
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
  const [roleOverride, setRoleOverride] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const effectiveUser = user ? { ...user, role: roleOverride || user.role } : null

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
      const dummyPass = Math.random().toString(36).slice(-10) + 'A1@'
      await pb.collection('users').create({
        ...data,
        password: data.password || dummyPass,
        passwordConfirm: data.passwordConfirm || dummyPass,
        status: 'Pendente',
        role: data.role || 'Visitante',
        codigo: data.codigo || tempCodigo,
        formacao: data.formacao,
        crea: data.crea,
        phone: data.phone,
      })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.send('/backend/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      pb.authStore.save(authData.token, authData.record)

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
    } catch (error: any) {
      const msg = error?.response?.message || error?.message || 'Credenciais inválidas.'
      return { error: { message: msg } }
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

  const confirmPasswordReset = async (token: string, password: string, passwordConfirm: string) => {
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
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
        user: effectiveUser,
        originalUser: user,
        roleOverride,
        setRoleOverride,
        signUp,
        signIn,
        signOut,
        requestPasswordReset,
        confirmPasswordReset,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
