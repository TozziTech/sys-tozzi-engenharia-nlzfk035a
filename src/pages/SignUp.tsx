import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { HardHat, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function SignUp() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'Visitante'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState(initialRole)
  const [formacao, setFormacao] = useState('')
  const [crea, setCrea] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signUp({
      name,
      email,
      phone,
      role,
      formacao: role === 'Projetista' ? formacao : undefined,
      crea: role === 'Projetista' ? crea : undefined,
    })

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: getErrorMessage(error),
      })
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            {success
              ? 'Cadastro realizado com sucesso!'
              : 'Preencha seus dados para solicitar acesso.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-sm font-medium">
                Seu cadastro foi realizado e está aguardando aprovação do administrador.
              </p>
              <Button onClick={() => navigate('/login')} className="mt-4 w-full">
                Voltar para o Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Perfil Solicitado</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="Visitante">Visitante</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Projetista">Projetista</option>
                  <option value="Gerente de Projeto">Gerente de Projeto</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              {role === 'Projetista' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="formacao">Formação</Label>
                    <Input
                      id="formacao"
                      type="text"
                      placeholder="Ex: Engenharia Civil"
                      value={formacao}
                      onChange={(e) => setFormacao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crea">CREA / CAU</Label>
                    <Input
                      id="crea"
                      type="text"
                      placeholder="Número do registro"
                      value={crea}
                      onChange={(e) => setCrea(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? 'Criando...' : 'Solicitar Acesso'}
              </Button>
            </form>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="flex justify-center border-t p-4">
            <Button
              variant="link"
              className="text-muted-foreground flex items-center gap-2"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
