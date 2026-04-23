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
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4 md:p-8 overflow-hidden bg-slate-950">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/1080?q=modern%20architecture%20building&color=black')] opacity-20 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <div className="z-10 max-w-5xl w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="h-20 px-8 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-widest text-white uppercase flex items-center gap-3">
                <HardHat className="h-8 w-8 text-primary" />
                Tozzi Engenharia
              </h1>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Bem-vindo ao Sistema
          </h2>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto">
            Selecione seu perfil de acesso para entrar na plataforma ou solicitar uma nova conta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLES.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer group hover:border-primary hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border-slate-800 text-slate-100"
              onClick={() => navigate(`/login?role=${role.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-col items-start gap-4 pb-2">
                <div className="p-3 bg-primary/20 rounded-xl text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
                  <role.icon className="h-8 w-8" />
                </div>
                <div className="w-full flex items-center justify-between">
                  <CardTitle className="text-2xl text-white">{role.title}</CardTitle>
                  <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-slate-400">{role.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
