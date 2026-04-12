import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getProjectModules, deleteProjectModule } from '@/services/project_modules'
import { ProjectModule } from '@/types/project_modules'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Edit2, Trash2, Calendar, AlertTriangle, Clock, User, ListTree } from 'lucide-react'
import { format, differenceInHours } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { ProjectModuleModal } from './ProjectModuleModal'
import { ModuleTreeGrid } from './ModuleTreeGrid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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

export function ProjectModules({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [modules, setModules] = useState<ProjectModule[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<ProjectModule | undefined>(undefined)
  const [deleteModuleId, setDeleteModuleId] = useState<ProjectModule | null>(null)
  const [selectedModuleForTasks, setSelectedModuleForTasks] = useState<ProjectModule | null>(null)
  const [loading, setLoading] = useState(true)

  const canEdit = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'

  const loadModules = async () => {
    try {
      const data = await getProjectModules(projectId)
      setModules(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModules()
  }, [projectId])

  useRealtime('project_modules', () => {
    loadModules()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white'
      case 'Em Andamento':
        return 'bg-blue-500 hover:bg-blue-600 text-white'
      case 'Pausado':
        return 'bg-amber-500 hover:bg-amber-600 text-white'
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white'
    }
  }

  const handleDelete = async () => {
    if (!deleteModuleId || !user) return
    try {
      await deleteProjectModule(deleteModuleId.id, deleteModuleId.name, projectId, user.id)
      toast({ title: 'Módulo removido', description: 'A disciplina foi removida com sucesso.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a disciplina.',
        variant: 'destructive',
      })
    } finally {
      setDeleteModuleId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Módulos por Disciplina</CardTitle>
          <CardDescription>
            Gerencie as diferentes disciplinas técnicas deste projeto.
          </CardDescription>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditingModule(undefined)
              setIsModalOpen(true)
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Disciplina
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        ) : modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <Card key={mod.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">{mod.name}</h4>
                        {mod.deadline &&
                          mod.status !== 'Concluído' &&
                          differenceInHours(new Date(mod.deadline), new Date()) <= 72 &&
                          differenceInHours(new Date(mod.deadline), new Date()) > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="destructive"
                                    className="px-1.5 py-0 h-5 bg-orange-500 hover:bg-orange-600 border-none cursor-help"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Prazo Próximo
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    O prazo encerra em{' '}
                                    {differenceInHours(new Date(mod.deadline), new Date())} horas.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        {mod.deadline &&
                          mod.status !== 'Concluído' &&
                          differenceInHours(new Date(mod.deadline), new Date()) <= 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="destructive"
                                    className="px-1.5 py-0 h-5 border-none cursor-help"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Atrasado
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>O prazo deste módulo expirou.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                      </div>
                      {mod.deadline && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          Entrega: {format(new Date(mod.deadline), 'dd/MM/yyyy')}
                        </div>
                      )}
                    </div>
                    <Badge className={getStatusColor(mod.status)}>{mod.status}</Badge>
                  </div>

                  {mod.expand?.responsible && (
                    <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-md border border-border/50">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            mod.expand.responsible.avatar
                              ? pb.files.getURL(
                                  mod.expand.responsible as any,
                                  mod.expand.responsible.avatar,
                                )
                              : undefined
                          }
                        />
                        <AvatarFallback className="text-[10px]">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground leading-none">
                          {mod.expand.responsible.name || 'Usuário'}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                          Responsável pela disciplina
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Progresso</span>
                      <span>{mod.progress}%</span>
                    </div>
                    <Progress value={mod.progress} className="h-2" />
                  </div>

                  {mod.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 bg-muted/50 p-2 rounded">
                      {mod.notes}
                    </p>
                  )}

                  {canEdit && (
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedModuleForTasks(mod)}
                      >
                        <ListTree className="w-4 h-4 mr-2" /> Tarefas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingModule(mod)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteModuleId(mod)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remover
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma disciplina cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Divida o projeto em módulos técnicos para melhor acompanhamento.
            </p>
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingModule(undefined)
                  setIsModalOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Primeira Disciplina
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {canEdit && (
        <ProjectModuleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          module={editingModule}
        />
      )}

      <AlertDialog
        open={!!deleteModuleId}
        onOpenChange={(open) => !open && setDeleteModuleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Disciplina?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o módulo "{deleteModuleId?.name}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!selectedModuleForTasks}
        onOpenChange={(open) => !open && setSelectedModuleForTasks(null)}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="px-6 py-5 border-b shrink-0 bg-white dark:bg-slate-950">
            <DialogTitle className="text-xl">
              Estrutura Analítica (WBS) - {selectedModuleForTasks?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie a hierarquia de tarefas desta disciplina em formato de planilha.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/20">
            {selectedModuleForTasks && <ModuleTreeGrid moduleId={selectedModuleForTasks.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
