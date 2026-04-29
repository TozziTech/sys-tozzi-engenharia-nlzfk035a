import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit2, Eye, Trash2, Star, RotateCcw } from 'lucide-react'
import { Project } from '@/types/project'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { AnimatedProgress } from './AnimatedProgress'
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
import { usePermissions } from '@/hooks/use-permissions'

interface ProjectTableProps {
  projects: Project[]
  isTrashView?: boolean
}

export function ProjectTable({ projects, isTrashView }: ProjectTableProps) {
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const navigate = useNavigate()
  const { deleteProject, restoreProject } = useProjectStore()
  const { toast } = useToast()
  const { can } = usePermissions()

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
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-x-auto animate-fade-in-up">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Nome do Projeto</TableHead>
            <TableHead className="font-semibold">Cliente</TableHead>
            <TableHead className="font-semibold">Início</TableHead>
            <TableHead className="font-semibold">Entrega</TableHead>
            {isTrashView ? (
              <>
                <TableHead className="font-semibold">Excluído em</TableHead>
                <TableHead className="font-semibold w-[200px]">Dias Restantes</TableHead>
              </>
            ) : (
              <>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-[200px]">Progresso</TableHead>
              </>
            )}
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className={`group transition-colors ${!isTrashView ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/50'} ${isCritical(project) ? 'bg-destructive/5 hover:bg-destructive/10' : ''}`}
              onClick={() => !isTrashView && navigate(`/projects/${project.id}`)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
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
                      className={`focus:outline-none transition-colors ${project.is_priority ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-primary/60'}`}
                      title={project.is_priority ? 'Remover prioridade' : 'Marcar como prioridade'}
                    >
                      <Star className={`h-4 w-4 ${project.is_priority ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  {project.name}
                  {isCritical(project) && (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Crítico
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{project.client}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(project.startDate), 'dd MMM yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(project.endDate), 'dd MMM yyyy', { locale: ptBR })}
              </TableCell>
              {isTrashView ? (
                <>
                  <TableCell className="text-muted-foreground">
                    {project.deletedAt
                      ? format(new Date(project.deletedAt), 'dd MMM yyyy', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {project.deletedAt ? (
                      <Badge
                        variant="outline"
                        className="bg-destructive/10 text-destructive border-destructive/20"
                      >
                        {Math.max(
                          0,
                          30 - differenceInDays(new Date(), new Date(project.deletedAt)),
                        )}{' '}
                        dias
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <AnimatedProgress value={project.progress} />
                  </TableCell>
                </>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  {isTrashView ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        restoreProject(project.id)
                        toast({
                          title: 'Projeto restaurado',
                          description: 'Projeto restaurado com sucesso.',
                        })
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Restaurar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/projects/${project.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {can('edit', 'projects') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setProjectToEdit(project)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {can('delete', 'projects') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setProjectToDelete(project)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>{' '}
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
