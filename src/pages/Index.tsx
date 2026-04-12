import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowRight, AlertCircle, Clock, CheckCircle2, Briefcase } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { isToday, parseISO } from 'date-fns'

interface Project {
  id: string
  name: string
  client: string
  status: string
}

interface UrgentTask {
  id: string
  titulo: string
  projeto_id: string
  project?: Project
  dueDate: string
}

export default function Index() {
  const [projects, setProjects] = useState<Project[]>([])
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const projs = await pb.collection('projects').getFullList<Project>()
      setProjects(projs)

      const th = await pb
        .collection('tarefas_hierarquicas')
        .getFullList({ filter: 'concluida = false' })

      const todayTasks = th.filter((t) => {
        const dueDate = t.dados_customizados?.dueDate || t.dados_customizados?.due_date
        if (!dueDate) return false
        try {
          return isToday(parseISO(dueDate))
        } catch {
          return false
        }
      })

      setUrgentTasks(
        todayTasks
          .map((t) => ({
            id: t.id,
            titulo: t.titulo,
            projeto_id: t.projeto_id,
            project: projs.find((p) => p.id === t.projeto_id),
            dueDate: t.dados_customizados?.dueDate || t.dados_customizados?.due_date,
          }))
          .filter((t) => t.project),
      )
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projects', loadData)
  useRealtime('tarefas_hierarquicas', loadData)

  const activeProjects = projects.filter((p) => p.status === 'Em Andamento').length
  const completedProjects = projects.filter((p) => p.status === 'Concluído').length

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground animate-pulse">Carregando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo ao painel de controle. Aqui está o resumo das suas atividades.
        </p>
      </div>

      {/* Critical Deadlines Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Prazos Críticos (Hoje)
        </h2>

        {urgentTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentTasks.map((task) => (
              <Alert
                key={task.id}
                variant="destructive"
                className="bg-destructive/5 border-destructive/20 relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span className="font-semibold truncate pr-4">{task.titulo}</span>
                  <span className="text-xs font-normal whitespace-nowrap bg-destructive/10 px-2 py-1 rounded-full text-destructive">
                    Hoje
                  </span>
                </AlertTitle>
                <AlertDescription className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    Projeto: {task.project?.name}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    asChild
                    className="p-0 h-auto text-destructive hover:text-destructive/80"
                  >
                    <Link to={`/projects/${task.projeto_id}`}>
                      Acessar <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30">
            <CardContent className="flex items-center gap-3 py-6 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Nenhuma tarefa urgente para hoje. Tudo sob controle!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Projetos
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {activeProjects}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedProjects}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button asChild>
          <Link to="/projects">
            Ver Todos os Projetos <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
