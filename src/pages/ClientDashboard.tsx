import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Activity,
  FileText,
  Layers,
  ArrowRight,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getClientProjects } from '@/services/client_dashboard'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState({
    activePhases: 0,
    pendingDocs: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const projs = await getClientProjects()
      setProjects(projs)

      const phases = await pb.collection('fases_projeto').getFullList({
        filter: "status = 'Em Andamento'",
      })

      const docs = await pb.collection('documentos_projeto').getFullList()

      setStats({
        activePhases: phases.length,
        pendingDocs: docs.length,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('projetos_cliente', loadData)
  useRealtime('fases_projeto', loadData)
  useRealtime('documentos_projeto', loadData)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
      case 'Em Execução':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-transparent'
      case 'Planejamento':
        return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
      default:
        return 'bg-secondary text-secondary-foreground border-transparent'
    }
  }

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-8 mx-auto animate-fade-in pb-20">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-blue-600 text-primary-foreground shadow-elevation">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/800/400?q=architecture&color=blue')] opacity-20 bg-cover bg-center mix-blend-overlay" />
        <div className="relative p-8 md:p-12 backdrop-blur-sm">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 animate-fade-in-up">
            Bem-vindo(a), {user?.name || 'Cliente'}!
          </h1>
          <p
            className="text-primary-foreground/90 text-lg md:text-xl max-w-2xl animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Aqui você acompanha a evolução dos seus projetos com total transparência e praticidade.
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-muted hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
              <p className="text-3xl font-bold">{projects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-muted hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-2xl">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fases em Andamento</p>
              <p className="text-3xl font-bold">{stats.activePhases}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-muted hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 rounded-2xl">
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documentos</p>
              <p className="text-3xl font-bold">{stats.pendingDocs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" /> Meus Projetos
        </h2>

        {projects.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-bold mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Você ainda não possui projetos ativos vinculados à sua conta. Entre em contato para
                iniciarmos o seu próximo grande projeto.
              </p>
              <Button onClick={() => (window.location.href = 'mailto:contato@exemplo.com')}>
                <Phone className="w-4 h-4 mr-2" /> Falar com Atendimento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <Card
                key={project.id}
                className="group overflow-hidden flex flex-col cursor-pointer hover:shadow-elevation hover:border-primary/50 transition-all duration-300"
                onClick={() => navigate(`/gestao/painel-cliente/${project.id}`)}
                style={{ animationDelay: `${400 + idx * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {project.nome_projeto}
                    </CardTitle>
                    <Badge className={getStatusColor(project.status_geral)} variant="outline">
                      {project.status_geral}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Início:{' '}
                      {project.data_inicio
                        ? format(new Date(project.data_inicio), 'dd/MM/yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progresso</span>
                      <span className="font-bold text-primary">
                        {project.progresso_total || 0}%
                      </span>
                    </div>
                    <Progress value={project.progresso_total || 0} className="h-2.5 bg-secondary" />
                  </div>
                </CardContent>
                <CardFooter className="pt-4 bg-muted/30 group-hover:bg-muted/50 transition-colors border-t">
                  <span className="text-sm font-medium flex items-center text-primary">
                    Ver detalhes do projeto{' '}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
