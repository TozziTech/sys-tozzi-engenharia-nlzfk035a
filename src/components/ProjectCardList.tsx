import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Project } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { AnimatedProgress } from './AnimatedProgress'
import {
  CalendarDays,
  User,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
  Star,
  RotateCcw,
  GripHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditProjectModal } from './EditProjectModal'
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
import useProjectStore from '@/stores/useProjectStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ProjectCardListProps {
  projects: Project[]
  isTrashView?: boolean
}

export function ProjectCardList({ projects, isTrashView }: ProjectCardListProps) {
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const { deleteProject, restoreProject } = useProjectStore()
  const { projectOrder, setProjectOrder } = usePreferencesStore()
  const { user } = useAuth()
  const { toast } = useToast()

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const sortedProjects = useMemo(() => {
    if (isTrashView || !projectOrder || projectOrder.length === 0) return projects
    return [...projects].sort((a, b) => {
      const indexA = projectOrder.indexOf(a.id)
      const indexB = projectOrder.indexOf(b.id)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }, [projects, projectOrder, isTrashView])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isTrashView) return
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (isTrashView) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggedId) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (isTrashView) return
    e.preventDefault()
    setDragOverId(null)

    if (draggedId && draggedId !== targetId) {
      const currentOrder = projectOrder.length > 0 ? projectOrder : projects.map((p) => p.id)
      const missing = projects.map((p) => p.id).filter((id) => !currentOrder.includes(id))
      const fullOrder = [...currentOrder, ...missing]

      const oldIndex = fullOrder.indexOf(draggedId)
      const newIndex = fullOrder.indexOf(targetId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...fullOrder]
        newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, draggedId)
        setProjectOrder(newOrder, user?.id)
      }
    }
    setDraggedId(null)
  }

  const isCritical = (project: Project) => {
    if (project.status === 'Concluído' || project.deletedAt) return false
    const end = startOfDay(new Date(project.endDate))
    const today = startOfDay(new Date())
    const diff = differenceInDays(end, today)
    return diff <= 3
  }

  const handleDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id)
      toast({
        title: 'Projeto movido para a lixeira',
        description: 'Projeto movido para a lixeira. Você tem 30 dias para restaurá-lo.',
      })
      setProjectToDelete(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
      {sortedProjects.map((project) => (
        <Card
          key={project.id}
          draggable={!isTrashView}
          onDragStart={(e) => handleDragStart(e, project.id)}
          onDragOver={(e) => handleDragOver(e, project.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, project.id)}
          onDragEnd={() => {
            setDraggedId(null)
            setDragOverId(null)
          }}
          className={cn(
            'overflow-hidden shadow-sm relative transition-all duration-200 bg-card text-card-foreground',
            isTrashView
              ? 'border-border opacity-80'
              : isCritical(project)
                ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
                : 'border-border hover:border-primary/50 hover:shadow-md cursor-grab active:cursor-grabbing',
            draggedId === project.id && 'opacity-50 scale-95 z-50 ring-2 ring-primary/50',
            dragOverId === project.id && 'ring-2 ring-primary ring-offset-2 scale-105 bg-muted/80',
          )}
        >
          {!isTrashView && (
            <Link
              to={`/projects/${project.id}`}
              className="absolute inset-0 z-10"
              draggable={false}
            >
              <span className="sr-only">Ver detalhes do projeto {project.name}</span>
            </Link>
          )}
          <CardHeader
            className={`pb-3 ${isCritical(project) && !isTrashView ? 'bg-destructive/10' : 'bg-muted/30'}`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2 w-full">
                  {!isTrashView && (
                    <div
                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors z-20"
                      title="Arraste para reordenar"
                    >
                      <GripHorizontal className="h-4 w-4" />
                    </div>
                  )}
                  {!isTrashView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        pb.collection('projects')
                          .update(project.id, { is_priority: !project.is_priority })
                          .then(() =>
                            useProjectStore
                              .getState()
                              .updateProject(project.id, { is_priority: !project.is_priority }),
                          )
                          .catch(console.error)
                      }}
                      className={`focus:outline-none transition-colors z-20 relative ${project.is_priority ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-primary/60'}`}
                    >
                      <Star className={`h-5 w-5 ${project.is_priority ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  <CardTitle className="text-lg font-bold leading-tight z-20 relative flex-1 line-clamp-1">
                    {isTrashView ? (
                      project.name
                    ) : (
                      <Link to={`/projects/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    )}
                  </CardTitle>
                  {!isTrashView && <StatusBadge status={project.status} />}
                </div>
                {isCritical(project) && !isTrashView && (
                  <Badge
                    variant="destructive"
                    className="w-fit h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider mt-1 z-20 relative"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Crítico
                  </Badge>
                )}
                <div className="flex gap-2 relative z-20 mt-2">
                  {isTrashView ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.preventDefault()
                        restoreProject(project.id)
                        toast({
                          title: 'Projeto restaurado',
                          description: 'Projeto restaurado com sucesso.',
                        })
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" /> Restaurar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault()
                          setProjectToEdit(project)
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 border-destructive/20 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setProjectToDelete(project)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span className="truncate">{project.discipline}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="truncate">{project.client}</span>
              </div>

              {!isTrashView ? (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>
                    {format(new Date(project.startDate), 'dd/MM/yyyy')} -{' '}
                    {format(new Date(project.endDate), 'dd/MM/yyyy')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1 col-span-2 mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Excluído em:</span>
                    <span className="font-medium text-foreground">
                      {project.deletedAt ? format(new Date(project.deletedAt), 'dd/MM/yyyy') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Exclusão permanente em:</span>
                    <span className="font-bold text-destructive">
                      {project.deletedAt
                        ? Math.max(
                            0,
                            30 - differenceInDays(new Date(), new Date(project.deletedAt)),
                          )
                        : '-'}{' '}
                      dias
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isTrashView && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-foreground">Progresso</div>
                <AnimatedProgress value={project.progress} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {projectToEdit && (
        <EditProjectModal
          project={projectToEdit}
          open={!!projectToEdit}
          onOpenChange={(open) => !open && setProjectToEdit(null)}
        />
      )}

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para a lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está movendo o projeto "{projectToDelete?.name}" para a lixeira. Ele poderá ser
              restaurado em até 30 dias antes de ser excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
