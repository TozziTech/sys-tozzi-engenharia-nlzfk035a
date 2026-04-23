import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Eye,
  Building2,
  GraduationCap,
  DraftingCompass,
  Network,
  ShieldCheck,
  ChevronRight,
  HardHat,
} from 'lucide-react'

const ROLES = [
  {
    id: 'Visitante',
    title: 'Visitante',
    desc: 'Acesso limitado para consulta de portfólio.',
    icon: Eye,
  },
  {
    id: 'Cliente',
    title: 'Cliente',
    desc: 'Acompanhe o andamento dos seus projetos e finanças.',
    icon: Building2,
  },
  {
    id: 'Estagiário',
    title: 'Estagiário',
    desc: 'Apoio em projetos e aprendizado contínuo.',
    icon: GraduationCap,
  },
  {
    id: 'Projetista',
    title: 'Projetista',
    desc: 'Acesse suas disciplinas e entregas técnicas.',
    icon: DraftingCompass,
  },
  {
    id: 'Gerente de Projeto',
    title: 'Gerente',
    desc: 'Gestão de cronogramas, equipes e gargalos.',
    icon: Network,
  },
  {
    id: 'Administrador',
    title: 'Administrador',
    desc: 'Controle total do sistema e aprovações.',
    icon: ShieldCheck,
  },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4 md:p-8 overflow-hidden bg-zinc-950 font-sans selection:bg-amber-500/30">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/1080?q=architectural%20blueprint&color=black')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div
        className="z-10 w-full space-y-12 animate-fade-in-up"
        style={{ animationDuration: '1s' }}
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-8">
            <div className="px-6 py-4 md:px-10 md:py-5 bg-zinc-900/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_40px_-10px_rgba(245,158,11,0.15)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600 uppercase flex items-center gap-3 md:gap-4">
                <HardHat
                  className="h-8 w-8 md:h-12 md:w-12 text-amber-400 drop-shadow-lg"
                  strokeWidth={2}
                />
                Tozzi Engenharia
              </h1>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-100">
              Selecione seu Perfil
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
              Escolha o tipo de acesso para entrar na plataforma com uma experiência personalizada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-[1200px] mx-auto relative z-10 px-4">
          {ROLES.map((role, index) => (
            <Card
              key={role.id}
              className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[360px] cursor-pointer group hover:border-amber-500/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.25)] transition-all duration-500 relative overflow-hidden bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 text-zinc-100 hover:-translate-y-1.5 animate-fade-in-up"
              style={{
                animationDelay: `${index * 120 + 200}ms`,
                animationFillMode: 'both',
                animationDuration: '600ms',
              }}
              onClick={() => navigate(`/login?role=${role.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="flex flex-col items-start gap-4 pb-2 relative z-10">
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/10 group-hover:border-amber-500/40 transition-all duration-500 shadow-lg group-hover:shadow-amber-500/20">
                  <role.icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div className="w-full flex items-center justify-between mt-2">
                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400 group-hover:from-amber-200 group-hover:to-amber-500 transition-all duration-500">
                    {role.title}
                  </CardTitle>
                  <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-amber-400 transition-all duration-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-2 pb-6">
                <CardDescription className="text-base text-zinc-400 group-hover:text-zinc-300 transition-colors duration-500 leading-relaxed">
                  {role.desc}
                </CardDescription>
              </CardContent>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-700 ease-in-out" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
