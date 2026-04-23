import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ShieldAlert } from 'lucide-react'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  if (!user || !user.must_change_password) {
    navigate('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== passwordConfirm) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não conferem.',
      })
      return
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A senha deve ter pelo menos 8 caracteres.',
      })
      return
    }

    setLoading(true)

    try {
      await pb.collection('users').update(user.id, {
        password,
        passwordConfirm,
        must_change_password: false,
      })

      // Refresh auth to secure the new password context
      await pb.collection('users').authWithPassword(user.email, password)

      toast({
        title: 'Sucesso',
        description: 'Sua senha foi atualizada. Bem-vindo!',
      })

      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description: error.message || 'Verifique os dados e tente novamente.',
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
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
