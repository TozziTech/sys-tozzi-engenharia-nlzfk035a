import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit2, Trash2, Star, RotateCcw, Archive, ArchiveRestore } from 'lucide-react'
import { Project, Status } from '@/types/project'
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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
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
import { cn } from '@/lib/utils'

const STATUSES: Status[] = [
  'Planejamento',
  'Em Andamento',
  'Em Análise',
  'Em Correção',
  'Aguardando Pagamento',
  'Concluído',
  'Atrasado',
]

function ProgressEditCell({
  project,
  onChange,
  canEdit,
}: {
  project: Project
  onChange: (val: number) => void
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(project.progress.toString())

  if (isEditing) {
    return (
      <Input
        type="number"
        min="0"
        max="100"
        autoFocus
        className="h-8 w-20 text-xs"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setIsEditing(false)
          const num = Number(val)
          if (!isNaN(num) && num >= 0 && num <= 100) {
            if (num !== project.progress) {
              onChange(num)
            }
          } else {
            setVal(project.progress.toString())
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            setVal(project.progress.toString())
            setIsEditing(false)
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <div
      className={cn('w-full', canEdit && 'cursor-pointer hover:opacity-80 group/progress')}
      onClick={(e) => {
        if (canEdit) {
          e.stopPropagation()
          setIsEditing(true)
        }
      }}
      title={canEdit ? 'Clique para editar o progresso' : ''}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">{project.progress}%</span>
        {canEdit && (
          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/progress:opacity-100 transition-opacity" />
        )}
      </div>
      <AnimatedProgress value={project.progress} />
    </div>
  )
}

interface ProjectTableProps {
  projects: Project[]
  isTrashView?: boolean
  isArchivedView?: boolean
}

export function ProjectTable({ projects, isTrashView, isArchivedView }: ProjectTableProps) {
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const navigate = useNavigate()
  const { deleteProject, restoreProject, updateProject } = useProjectStore()
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
                <TableHead className="font-semibold w-[150px]">Progresso</TableHead>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {can('edit', 'projects') ? (
                      <Select
                        value={project.status}
                        onValueChange={(val) => {
                          updateProject(project.id, { status: val as Status })
                          toast({
                            title: 'Status atualizado',
                            description: `O status do projeto foi alterado para ${val}.`,
                          })
                        }}
                      >
                        <SelectTrigger className="h-auto p-0 border-none bg-transparent hover:bg-transparent shadow-none w-fit focus:ring-0 [&>svg]:hidden">
                          <StatusBadge status={project.status} className="cursor-pointer" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge status={project.status} />
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="w-[150px]">
                    <ProgressEditCell
                      project={project}
                      canEdit={can('edit', 'projects')}
                      onChange={(val) => {
                        updateProject(project.id, { progress: val })
                        toast({
                          title: 'Progresso atualizado',
                          description: `O progresso do projeto foi alterado para ${val}%.`,
                        })
                      }}
                    />
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
                          setProjectToEdit(project)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {can('edit', 'projects') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title={project.is_archived ? 'Desarquivar' : 'Arquivar'}
                          onClick={(e) => {
                            e.stopPropagation()
                            updateProject(project.id, { is_archived: !project.is_archived })
                            toast({
                              title: project.is_archived
                                ? 'Projeto desarquivado'
                                : 'Projeto arquivado',
                              description: project.is_archived
                                ? 'O projeto voltou para a lista de ativos.'
                                : 'O projeto foi movido para os arquivados.',
                            })
                          }}
                        >
                          {project.is_archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
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
              </TableCell>
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
