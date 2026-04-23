import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { HardHat, Eye, EyeOff, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Token inválido',
        description: 'O link de recuperação de senha é inválido ou expirou.',
      })
      navigate('/login')
    }
  }, [token, navigate, toast])

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

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não conferem',
        description: 'As senhas digitadas não são iguais.',
      })
      return
    }

    if (!token) return

    setLoading(true)

    const { error } = await confirmPasswordReset(token, password, confirmPassword)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description:
          error?.response?.message ||
          'Ocorreu um erro ao tentar redefinir a senha. O link pode ter expirado.',
      })
      setLoading(false)
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.id) {
        await pb.send('/backend/v1/log-recovery-reset', {
          method: 'POST',
          body: JSON.stringify({ userId: payload.id }),
        })
      }
    } catch (err) {
      console.error('Failed to log recovery reset', err)
    }

    toast({
      title: 'Senha atualizada com sucesso',
      description: 'Você já pode fazer login com sua nova senha.',
    })

    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <HardHat className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>Crie uma nova senha segura para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
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
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading || !isPasswordValid}>
              {loading ? 'Salvando...' : 'Redefinir Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
