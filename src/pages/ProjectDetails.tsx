import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useProjectStore from '@/stores/useProjectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/StatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react'
import { EditProjectModal } from '@/components/EditProjectModal'
import { ProjectComments } from '@/components/ProjectComments'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

const MOCK_TASKS = [
  { id: 1, title: 'Levantamento topográfico', status: 'completed', assignee: 'João Carlos' },
  { id: 2, title: 'Projeto base', status: 'completed', assignee: 'Ana Silva' },
  { id: 3, title: 'Aprovação na prefeitura', status: 'in_progress', assignee: undefined },
  { id: 4, title: 'Início das obras', status: 'pending', assignee: undefined },
]

const MOCK_TEAM = [
  {
    id: 1,
    name: 'João Carlos',
    role: 'Arquiteto Sênior',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
  },
  {
    id: 2,
    name: 'Ana Silva',
    role: 'Engenheira Civil',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
  },
  {
    id: 3,
    name: 'Marcos Paulo',
    role: 'Mestre de Obras',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
  },
]

const MOCK_HISTORY = [
  { id: 1, date: '2024-03-01', time: '10:00', action: 'Projeto criado no sistema' },
  { id: 2, date: '2024-03-05', time: '14:30', action: 'Documentação anexada: Planta Baixa.pdf' },
  { id: 3, date: '2024-03-10', time: '09:15', action: 'Status alterado para Em Andamento' },
  { id: 4, date: '2024-03-12', time: '16:45', action: 'Orçamento estimado atualizado' },
]

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, deleteProject, assignTask } = useProjectStore()
  const { toast } = useToast()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tasks, setTasks] = useState(MOCK_TASKS)

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id])

  const handleAssignTask = (taskId: number, taskTitle: string) => {
    if (!project) return
    assignTask(project.name, taskTitle, 'Você')
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, assignee: 'Você' } : t)))
    toast({
      title: 'Tarefa atribuída',
      description: 'A notificação foi disparada.',
    })
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4">Projeto não encontrado</h2>
        <Button onClick={() => navigate('/projects')}>Voltar para Projetos</Button>
      </div>
    )
  }

  const handleDelete = () => {
    deleteProject(project.id)
    toast({
      title: 'Projeto deletado',
      description: 'O projeto foi removido com sucesso.',
      variant: 'destructive',
    })
    navigate('/projects')
  }

  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const budget = project.budget || 0
  const spent = project.spent || 0
  const budgetPercentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Deletar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
                  <CardDescription className="text-base mt-1">{project.client}</CardDescription>
                </div>
                <StatusBadge status={project.status} className="px-3 py-1 text-sm font-medium" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Disciplina
                    </p>
                    <p className="font-medium">{project.discipline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Engenheiro Resp.
                    </p>
                    <p className="font-medium">{project.engineer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Início
                    </p>
                    <p className="font-medium">
                      {project.startDate.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Entrega
                    </p>
                    <p className="font-medium">{project.endDate.split('-').reverse().join('/')}</p>
                  </div>
                </div>
              </div>

              {project.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm">{project.description}</p>
                </div>
              )}
              {project.observations && (
                <div className="mt-4 p-3 bg-muted rounded-md border border-border">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Observações
                  </p>
                  <p className="text-sm">{project.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tarefas do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : task.status === 'in_progress' ? (
                            <Clock className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                task.status === 'completed'
                                  ? 'line-through text-muted-foreground'
                                  : 'font-medium'
                              }
                            >
                              {task.title}
                            </span>
                            {task.assignee && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal text-muted-foreground"
                              >
                                {task.assignee}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!task.assignee && task.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleAssignTask(task.id, task.title)}
                            >
                              Atribuir a mim
                            </Button>
                          )}
                          <Badge variant="secondary" className="capitalize">
                            {task.status === 'completed'
                              ? 'Concluído'
                              : task.status === 'in_progress'
                                ? 'Em andamento'
                                : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipe Alocada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {MOCK_TEAM.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-muted-foreground/30 ml-3 space-y-6">
                    {MOCK_HISTORY.map((item) => (
                      <div key={item.id} className="pl-6 relative">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                          <span className="font-medium">{item.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.date.split('-').reverse().join('/')} às {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <ProjectComments projectId={project.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Conclusão</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Financeiro</CardTitle>
              <CardDescription>Orçamento vs Gasto real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Orçamento Estimado
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(budget)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Valor Gasto
                  </p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {formatCurrency(spent)}
                  </p>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5 text-muted-foreground font-medium">
                    <span>{budgetPercentage}% Consumido</span>
                  </div>
                  <Progress
                    value={budgetPercentage}
                    className={`h-2 ${budgetPercentage > 100 ? 'bg-red-100 [&>div]:bg-red-500' : budgetPercentage > 80 ? 'bg-amber-100 [&>div]:bg-amber-500' : ''}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProjectModal
        project={project}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente o projeto "
              {project.name}" do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
