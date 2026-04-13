import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Project } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { AnimatedProgress } from './AnimatedProgress'
import { CalendarDays, User, Layers, Edit2, Trash2, AlertCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, startOfDay } from 'date-fns'
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
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

interface ProjectCardListProps {
  projects: Project[]
}

export function ProjectCardList({ projects }: ProjectCardListProps) {
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const { deleteProject } = useProjectStore()
  const { toast } = useToast()

  const isCritical = (project: Project) => {
    if (project.status === 'Concluído') return false
    const end = startOfDay(new Date(project.endDate))
    const today = startOfDay(new Date())
    const diff = differenceInDays(end, today)
    return diff <= 3
  }

  const handleDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id)
      toast({
        title: 'Projeto excluído',
        description:
          'O projeto foi removido com sucesso. Nota: os dados serão resetados ao recarregar a página (sem backend).',
      })
      setProjectToDelete(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden animate-fade-in-up">
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`overflow-hidden shadow-sm relative transition-colors ${
            isCritical(project)
              ? 'border-red-300 bg-red-50/10 hover:border-red-400'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <Link to={`/projects/${project.id}`} className="absolute inset-0 z-10">
            <span className="sr-only">Ver detalhes do projeto {project.name}</span>
          </Link>
          <CardHeader className={`pb-3 ${isCritical(project) ? 'bg-red-50/50' : 'bg-slate-50/50'}`}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
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
                    className={`focus:outline-none transition-colors z-20 relative ${project.is_priority ? 'text-yellow-500 hover:text-yellow-600' : 'text-slate-300 hover:text-yellow-400'}`}
                  >
                    <Star className={`h-5 w-5 ${project.is_priority ? 'fill-current' : ''}`} />
                  </button>
                  <CardTitle className="text-lg font-bold text-slate-900 leading-tight z-20 relative">
                    <Link to={`/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </CardTitle>
                  {isCritical(project) && (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Crítico
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 relative z-20 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
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
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.preventDefault()
                      setProjectToDelete(project)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Layers className="h-4 w-4 text-slate-400" />
                <span className="truncate">{project.discipline}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span className="truncate">{project.client}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  {format(new Date(project.startDate), 'dd/MM/yyyy')} -{' '}
                  {format(new Date(project.endDate), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-700">Progresso</div>
              <AnimatedProgress value={project.progress} />
            </div>
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
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto "
              {projectToDelete?.name}" do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
