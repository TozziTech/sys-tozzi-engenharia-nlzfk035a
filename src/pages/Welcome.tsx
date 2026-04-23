import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HardHat, User, UserCircle, Briefcase, ShieldAlert, ArrowRight } from 'lucide-react'

const ROLES = [
  {
    id: 'Cliente',
    title: 'Cliente',
    desc: 'Acompanhe o andamento dos seus projetos e finanças.',
    icon: User,
  },
  {
    id: 'Projetista',
    title: 'Projetista',
    desc: 'Acesse suas disciplinas e entregas técnicas.',
    icon: HardHat,
  },
  {
    id: 'Gerente de Projeto',
    title: 'Gerente',
    desc: 'Gestão de cronogramas, equipes e gargalos.',
    icon: Briefcase,
  },
  {
    id: 'Administrador',
    title: 'Administrador',
    desc: 'Controle total do sistema e aprovações.',
    icon: ShieldAlert,
  },
  { id: 'Visitante', title: 'Visitante', desc: 'Acesso limitado para consulta.', icon: UserCircle },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="max-w-5xl w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Bem-vindo ao Sistema
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Selecione seu perfil de acesso para entrar na plataforma ou solicitar uma nova conta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLES.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer group hover:border-primary hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              onClick={() => navigate(`/login?role=${role.id}`)}
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-col items-start gap-4 pb-2">
                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <role.icon className="h-8 w-8" />
                </div>
                <div className="w-full flex items-center justify-between">
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{role.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
