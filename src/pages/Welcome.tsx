import { useEffect, useState } from 'react'
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
  Users,
  UserCheck,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { PieChart, Pie } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

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

const roleConfig = {
  value: { label: 'Colaboradores' },
  Administrador: { label: 'Administrador', color: '#f59e0b' },
  'Gerente de Projeto': { label: 'Gerente de Projeto', color: '#d97706' },
  Projetista: { label: 'Projetista', color: '#fbbf24' },
  Estagiário: { label: 'Estagiário', color: '#fcd34d' },
  Visitante: { label: 'Visitante', color: '#fef3c7' },
  Cliente: { label: 'Cliente', color: '#b45309' },
  'Sem Função': { label: 'Sem Função', color: '#52525b' },
} satisfies ChartConfig

const statusConfig = {
  value: { label: 'Colaboradores' },
  Ativo: { label: 'Ativo', color: '#f59e0b' },
  Inativo: { label: 'Inativo', color: '#52525b' },
  'Em Férias': { label: 'Em Férias', color: '#fbbf24' },
  Pendente: { label: 'Pendente', color: '#fcd34d' },
  'Sem Status': { label: 'Sem Status', color: '#71717a' },
} satisfies ChartConfig

export default function Welcome() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({ fields: 'id,role,status' })
      setUsers(records)
    } catch (err) {
      console.error('Failed to fetch users for stats:', err)
      // Gracefully leave empty if unauthorized
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useRealtime('users', () => {
    fetchUsers()
  })

  const roleCount = users.reduce(
    (acc, user) => {
      const role = user.role || 'Sem Função'
      acc[role] = (acc[role] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const statusCount = users.reduce(
    (acc, user) => {
      const status = user.status || 'Sem Status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const roleDataWithFill = Object.entries(roleCount).map(([name, value]) => ({
    name,
    value,
    fill: (roleConfig as any)[name]?.color || '#52525b',
  }))

  const statusDataWithFill = Object.entries(statusCount).map(([name, value]) => ({
    name,
    value,
    fill: (statusConfig as any)[name]?.color || '#71717a',
  }))

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative p-4 py-12 md:p-8 overflow-x-hidden overflow-y-auto bg-zinc-950 font-sans selection:bg-amber-500/30">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/1080?q=architectural%20blueprint&color=black')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <div
        className="z-10 w-full space-y-16 animate-fade-in-up max-w-[1200px]"
        style={{ animationDuration: '1s' }}
      >
        <div className="text-center space-y-6 mt-8 md:mt-12">
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

        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mx-auto relative z-10 px-4">
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

        {/* Statistics Section */}
        <div
          className="w-full mx-auto pb-16 z-10 px-4 animate-fade-in-up"
          style={{ animationDelay: '800ms', animationFillMode: 'both' }}
        >
          <div className="flex flex-col items-center mb-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Users className="h-7 w-7 text-amber-500" />
              <h3 className="text-3xl font-bold text-zinc-100 tracking-tight">Resumo da Equipe</h3>
            </div>
            <p className="text-zinc-400 text-lg font-light max-w-xl mx-auto">
              Visão geral em tempo real da distribuição e status dos colaboradores na plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Role Chart Card */}
            <Card className="bg-zinc-900/80 backdrop-blur-xl border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)] transition-all hover:border-amber-500/40 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-amber-400 flex items-center gap-2 font-semibold">
                  <UserCheck className="h-5 w-5" />
                  Distribuição por Perfil
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Total de colaboradores por função
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="h-[280px] flex items-center justify-center text-zinc-500 animate-pulse">
                    Carregando dados...
                  </div>
                ) : users.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <ChartContainer config={roleConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={roleDataWithFill}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={3}
                        stroke="rgba(24, 24, 27, 0.8)"
                        strokeWidth={2}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Status Chart Card */}
            <Card className="bg-zinc-900/80 backdrop-blur-xl border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)] transition-all hover:border-amber-500/40 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-amber-400 flex items-center gap-2 font-semibold">
                  <Users className="h-5 w-5" />
                  Status dos Colaboradores
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Situação atual da equipe
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="h-[280px] flex items-center justify-center text-zinc-500 animate-pulse">
                    Carregando dados...
                  </div>
                ) : users.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                    Nenhum dado disponível
                  </div>
                ) : (
                  <ChartContainer config={statusConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={statusDataWithFill}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={3}
                        stroke="rgba(24, 24, 27, 0.8)"
                        strokeWidth={2}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
