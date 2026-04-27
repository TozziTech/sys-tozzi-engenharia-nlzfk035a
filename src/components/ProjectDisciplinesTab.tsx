import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Users, Briefcase, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { ProjectModule, SUB_DISCIPLINES_COLORS } from '@/types/project_modules'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

export function ProjectDisciplinesTab({ projectId }: { projectId: string }) {
  const [modules, setModules] = useState<ProjectModule[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projectAccesses, setProjectAccesses] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [newModuleName, setNewModuleName] = useState('')
  const [newModuleStatus, setNewModuleStatus] = useState<ProjectModule['status']>('Pendente')
  const [newModuleResponsible, setNewModuleResponsible] = useState<string>('none')
  const [newModuleDesigner, setNewModuleDesigner] = useState<string>('none')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { toast } = useToast()
  const { user } = useAuth()

  const canEdit = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [batchUsers, setBatchUsers] = useState<string[]>([])
  const [batchModules, setBatchModules] = useState<string[]>([])
  const [batchRole, setBatchRole] = useState<'responsible' | 'designer'>('responsible')
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false)

  const toggleBatchUser = (id: string) => {
    setBatchUsers((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]))
  }
  const toggleBatchModule = (id: string) => {
    setBatchModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const handleBatchAssign = async () => {
    setIsSubmittingBatch(true)
    let assignments = 0

    try {
      for (const userId of batchUsers) {
        for (const moduleId of batchModules) {
          const mod = modules.find((m) => m.id === moduleId)
          if (!mod) continue

          const oldUserId = mod[batchRole]
          if (oldUserId !== userId) {
            await pb.collection('project_modules').update(moduleId, {
              [batchRole]: userId === 'unassigned' ? null : userId,
            })
            assignments++

            try {
              await pb.collection('audit_logs').create({
                user_id: user?.id,
                action: 'assignment_added',
                resource: 'user_project_access',
                details: {
                  project_id: projectId,
                  target_user: userId,
                  role: batchRole === 'responsible' ? 'Responsável' : 'Projetista',
                  module_name: mod.name,
                  batch: true,
                },
              })
            } catch (auditErr) {
              console.error('Erro ao salvar log de auditoria', auditErr)
            }
          }
        }
      }
      toast({
        title: 'Atribuição em Lote Concluída',
        description: `${assignments} atribuição(ões) realizada(s). O acesso foi concedido automaticamente.`,
      })
      setIsBatchModalOpen(false)
      setBatchUsers([])
      setBatchModules([])
    } catch (e) {
      toast({ title: 'Erro na atribuição em lote', variant: 'destructive' })
    } finally {
      setIsSubmittingBatch(false)
    }
  }

  const loadData = async () => {
    try {
      const [mods, usrs, accessesRes, requestsRes] = await Promise.all([
        pb.collection('project_modules').getFullList<ProjectModule>({
          filter: `project = "${projectId}"`,
          expand: 'responsible,designer',
        }),
        pb.collection('users').getFullList({ filter: 'status != "Inativo"' }),
        pb.collection('user_project_access').getFullList({ filter: `project = "${projectId}"` }),
        pb
          .collection('access_requests')
          .getFullList({ filter: `project = "${projectId}" && status = "Pendente"` }),
      ])
      setModules(mods)
      setUsers(usrs)
      setProjectAccesses(accessesRes)
      setPendingRequests(requestsRes)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (projectId) loadData()
  }, [projectId])

  useRealtime('project_modules', loadData)
  useRealtime('user_project_access', loadData)
  useRealtime('access_requests', loadData)

  const handleUpdate = async (
    moduleId: string,
    field: 'responsible' | 'designer',
    value: string,
  ) => {
    try {
      const oldModule = modules.find((m) => m.id === moduleId)
      const oldUserId = oldModule?.[field]

      await pb
        .collection('project_modules')
        .update(moduleId, { [field]: value === 'unassigned' ? null : value })
      toast({ title: 'Módulo atualizado com sucesso' })

      if (value !== (oldUserId || 'unassigned')) {
        try {
          await pb.collection('audit_logs').create({
            user_id: user?.id,
            action: value === 'unassigned' ? 'assignment_removed' : 'assignment_added',
            resource: 'user_project_access',
            details: {
              project_id: projectId,
              target_user: value === 'unassigned' ? oldUserId : value,
              role: field === 'responsible' ? 'Responsável' : 'Projetista',
              module_name: oldModule?.name,
            },
          })
        } catch (auditErr) {
          console.error('Erro ao salvar log de auditoria', auditErr)
        }
      }
    } catch (e) {
      toast({ title: 'Erro ao atualizar módulo', variant: 'destructive' })
    }
  }

  const handleAdd = async () => {
    setFieldErrors({})

    const errors: FieldErrors = {}
    if (!newModuleName.trim()) {
      errors.name = 'O nome da disciplina é obrigatório.'
    }
    if (!newModuleStatus) {
      errors.status = 'O status é obrigatório.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await pb.collection('project_modules').create({
        name: newModuleName,
        project: projectId,
        status: newModuleStatus,
        progress: 0,
        responsible: newModuleResponsible === 'none' ? null : newModuleResponsible,
        designer: newModuleDesigner === 'none' ? null : newModuleDesigner,
      })
      setNewModuleName('')
      setNewModuleStatus('Pendente')
      setNewModuleResponsible('none')
      setNewModuleDesigner('none')
      toast({ title: 'Módulo adicionado' })
    } catch (e) {
      setFieldErrors(extractFieldErrors(e))
      toast({
        title: 'Erro ao adicionar módulo',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('project_modules').delete(id)
      toast({ title: 'Módulo removido' })
    } catch (e) {
      toast({ title: 'Erro ao remover módulo', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Disciplinas e Equipe
          </CardTitle>
          <CardDescription>
            Gerencie as disciplinas do projeto e defina o Responsável (Gerente) e o Projetista
            (Designer) para cada uma.
          </CardDescription>
        </div>
        {canEdit && (
          <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Atribuição em Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Atribuição em Lote</DialogTitle>
                <DialogDescription>
                  Atribua múltiplos usuários a várias disciplinas de uma só vez.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">1. Selecione os Usuários</Label>
                    <div className="mt-2 border rounded-md h-[200px] overflow-y-auto p-2 bg-muted/20 space-y-2">
                      {users
                        .filter(
                          (u) =>
                            u.status === 'Ativo' &&
                            (batchRole === 'designer'
                              ? u.role === 'Projetista'
                              : ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(
                                  u.role,
                                )),
                        )
                        .map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded"
                          >
                            <Checkbox
                              id={`user-${u.id}`}
                              checked={batchUsers.includes(u.id)}
                              onCheckedChange={() => toggleBatchUser(u.id)}
                            />
                            <Label
                              htmlFor={`user-${u.id}`}
                              className="text-sm cursor-pointer flex-1 truncate"
                            >
                              {u.name}
                            </Label>
                          </div>
                        ))}
                      {users.filter(
                        (u) =>
                          u.status === 'Ativo' &&
                          (batchRole === 'designer'
                            ? u.role === 'Projetista'
                            : ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(
                                u.role,
                              )),
                      ).length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum usuário disponível
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">2. Selecione as Disciplinas</Label>
                    <div className="mt-2 border rounded-md h-[200px] overflow-y-auto p-2 bg-muted/20 space-y-2">
                      {modules.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded"
                        >
                          <Checkbox
                            id={`mod-${m.id}`}
                            checked={batchModules.includes(m.id)}
                            onCheckedChange={() => toggleBatchModule(m.id)}
                          />
                          <Label
                            htmlFor={`mod-${m.id}`}
                            className="text-sm cursor-pointer flex-1 truncate"
                          >
                            {m.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">3. Defina o Papel</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Select
                      value={batchRole}
                      onValueChange={(v: any) => {
                        setBatchRole(v)
                        setBatchUsers([])
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="responsible">Responsável</SelectItem>
                        <SelectItem value="designer">Projetista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsBatchModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleBatchAssign}
                  disabled={
                    batchUsers.length === 0 || batchModules.length === 0 || isSubmittingBatch
                  }
                >
                  {isSubmittingBatch ? 'Processando...' : 'Aplicar Atribuições'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {canEdit && (
          <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-sm font-medium">Adicionar Nova Disciplina</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
              <div className="md:col-span-3 space-y-1">
                <Input
                  placeholder="Nome da disciplina..."
                  value={newModuleName}
                  onChange={(e) => {
                    setNewModuleName(e.target.value)
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className={cn(
                    fieldErrors.name && 'border-destructive focus-visible:ring-destructive',
                  )}
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="md:col-span-2 space-y-1">
                <Select
                  value={newModuleStatus}
                  onValueChange={(v: ProjectModule['status']) => {
                    setNewModuleStatus(v)
                    if (fieldErrors.status) setFieldErrors((prev) => ({ ...prev, status: '' }))
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      fieldErrors.status && 'border-destructive focus:ring-destructive',
                    )}
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Pausado">Pausado</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.status && (
                  <p className="text-xs text-destructive">{fieldErrors.status}</p>
                )}
              </div>
              <div className="md:col-span-3 space-y-1">
                <Select value={newModuleResponsible} onValueChange={setNewModuleResponsible}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gerente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Gerente</SelectItem>
                    {users
                      .filter(
                        (u) =>
                          u.status === 'Ativo' &&
                          ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(u.role),
                      )
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.email ? `(${u.email})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <Select value={newModuleDesigner} onValueChange={setNewModuleDesigner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Projetista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Projetista</SelectItem>
                    {users
                      .filter((u) => u.status === 'Ativo' && u.role === 'Projetista')
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.email ? `(${u.email})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <Button onClick={handleAdd} className="w-full" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {modules.map((mod) => (
              <Card key={mod.id} className="flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 pb-3 flex flex-row items-start justify-between gap-2 border-b bg-muted/20">
                  <div className="space-y-1.5 flex-1 pr-2">
                    <Link
                      to={`/projects/${projectId}/disciplines/${mod.id}`}
                      className="font-semibold text-base text-primary hover:underline hover:text-amber-500 transition-colors line-clamp-1 flex items-center gap-2"
                      title={mod.name}
                    >
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{mod.name}</span>
                    </Link>

                    {mod.sub_disciplines && mod.sub_disciplines.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mod.sub_disciplines.map((sd) => (
                          <Badge
                            key={sd}
                            variant="outline"
                            className={cn(
                              'text-[9px] px-1.5 py-0 font-medium',
                              SUB_DISCIPLINES_COLORS[sd] || '',
                            )}
                          >
                            {sd}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center mt-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                          mod.status === 'Concluído' &&
                            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
                          mod.status === 'Em Andamento' &&
                            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
                          mod.status === 'Pausado' &&
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
                          mod.status === 'Pendente' &&
                            'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                          mod.status === 'Em Análise' &&
                            'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800',
                          mod.status === 'Em Revisão' &&
                            'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800',
                        )}
                      >
                        {mod.status}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(mod.id)}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remover disciplina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-center">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Gerente Responsável
                    </label>
                    {canEdit ? (
                      <div className="flex gap-2">
                        <Select
                          value={mod.responsible || 'unassigned'}
                          onValueChange={(v) => handleUpdate(mod.id, 'responsible', v)}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Sem responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned" className="text-muted-foreground italic">
                              Sem responsável
                            </SelectItem>
                            {users.filter(
                              (u) =>
                                (u.status === 'Ativo' &&
                                  ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(
                                    u.role,
                                  )) ||
                                u.id === mod.responsible,
                            ).length === 0 && (
                              <SelectItem value="none_disabled" disabled>
                                Nenhum responsável disponível
                              </SelectItem>
                            )}
                            {users
                              .filter(
                                (u) =>
                                  (u.status === 'Ativo' &&
                                    ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(
                                      u.role,
                                    )) ||
                                  u.id === mod.responsible,
                              )
                              .map((u) => {
                                const hasAccess = projectAccesses.some((a) => a.user === u.id)
                                const hasPending = pendingRequests.some((r) => r.user === u.id)
                                return (
                                  <SelectItem key={u.id} value={u.id}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={
                                            u.avatar
                                              ? pb.files.getURL(u, u.avatar)
                                              : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                                          }
                                        />
                                        <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {u.name} {u.email ? `(${u.email})` : ''}
                                      </span>
                                      {!hasAccess && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-1" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {hasPending
                                                ? 'Aguardando aprovação de acesso'
                                                : 'Sem acesso ao projeto'}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/10">
                        {mod.expand?.responsible ? (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={
                                  mod.expand.responsible.avatar
                                    ? pb.files.getURL(
                                        mod.expand.responsible as any,
                                        mod.expand.responsible.avatar,
                                      )
                                    : `https://img.usecurling.com/ppl/thumbnail?seed=${mod.expand.responsible.id}`
                                }
                              />
                              <AvatarFallback>
                                {mod.expand.responsible.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm">{mod.expand.responsible.name}</span>
                            {!projectAccesses.some((a) => a.user === mod.responsible) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {pendingRequests.some((r) => r.user === mod.responsible)
                                      ? 'Aguardando aprovação de acesso'
                                      : 'Sem acesso ao projeto'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Sem responsável
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Projetista (Designer)
                    </label>
                    {canEdit ? (
                      <div className="flex gap-2">
                        <Select
                          value={mod.designer || 'unassigned'}
                          onValueChange={(v) => handleUpdate(mod.id, 'designer', v)}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Sem projetista" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned" className="text-muted-foreground italic">
                              Sem projetista
                            </SelectItem>
                            {users.filter((u) => u.role === 'Projetista' || u.id === mod.designer)
                              .length === 0 && (
                              <SelectItem value="none_disabled" disabled>
                                Nenhum projetista disponível
                              </SelectItem>
                            )}
                            {users
                              .filter((u) => u.role === 'Projetista' || u.id === mod.designer)
                              .map((u) => {
                                const hasAccess = projectAccesses.some((a) => a.user === u.id)
                                const hasPending = pendingRequests.some((r) => r.user === u.id)
                                return (
                                  <SelectItem key={u.id} value={u.id}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={
                                            u.avatar
                                              ? pb.files.getURL(u, u.avatar)
                                              : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                                          }
                                        />
                                        <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                                      </Avatar>
                                      <span className="truncate">
                                        {u.name} {u.email ? `(${u.email})` : ''}
                                      </span>
                                      {!hasAccess && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-1" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {hasPending
                                                ? 'Aguardando aprovação de acesso'
                                                : 'Sem acesso ao projeto'}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/10">
                        {mod.expand?.designer ? (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={
                                  mod.expand.designer.avatar
                                    ? pb.files.getURL(
                                        mod.expand.designer as any,
                                        mod.expand.designer.avatar,
                                      )
                                    : `https://img.usecurling.com/ppl/thumbnail?seed=${mod.expand.designer.id}`
                                }
                              />
                              <AvatarFallback>
                                {mod.expand.designer.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm">{mod.expand.designer.name}</span>
                            {!projectAccesses.some((a) => a.user === mod.designer) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {pendingRequests.some((r) => r.user === mod.designer)
                                      ? 'Aguardando aprovação de acesso'
                                      : 'Sem acesso ao projeto'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">
                            Sem projetista
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-muted/10 text-center">
            <div className="bg-muted p-3 rounded-full mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma disciplina cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Este projeto ainda não possui disciplinas.{' '}
              {canEdit &&
                'Use o formulário acima para adicionar a primeira disciplina e começar a alocar a equipe.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
