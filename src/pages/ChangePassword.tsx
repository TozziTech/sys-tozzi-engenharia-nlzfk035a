import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ShieldAlert, Check, X, Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  if (!user || !user.must_change_password) {
    return <Navigate to="/" replace />
  }

  const requirements = [
    { label: 'Mínimo de 8 caracteres', met: password.length >= 8 },
    { label: 'Pelo menos uma letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Pelo menos um número', met: /[0-9]/.test(password) },
    {
      label: 'Pelo menos um caractere especial (ex: @, #, $, %)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]
  const isPasswordValid = requirements.every((r) => r.met)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid) {
      toast({
        variant: 'destructive',
        title: 'Requisitos de segurança não atendidos',
        description: 'A nova senha deve atender a todos os critérios listados.',
      })
      return
    }

    if (password !== passwordConfirm) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não conferem.',
      })
      return
    }

    if (!oldPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha atual é obrigatória.',
      })
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password,
        passwordConfirm,
        must_change_password: false,
      })

      await pb.collection('audit_logs').create({
        user_id: user.id,
        action: 'PASSWORD_CHANGE',
        resource: 'users',
        details: { method: 'self_service' },
      })

      // Refresh auth to secure the new password context
      await pb.collection('users').authWithPassword(user.email, password)

      toast({
        title: 'Senha atualizada com sucesso',
        description: 'Sua senha foi alterada e o acesso liberado.',
      })

      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description: getErrorMessage(error) || 'Verifique os dados e tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Alteração de Senha Obrigatória</CardTitle>
          <CardDescription>
            Por motivos de segurança, você precisa alterar a senha provisória para uma senha
            definitiva antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <p className="text-sm font-medium">Requisitos de segurança:</p>
              <ul className="space-y-1">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center text-xs gap-2">
                    {req.met ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
                      )}
                    >
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
              <Input
                id="passwordConfirm"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading || !isPasswordValid}>
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
