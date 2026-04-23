import { useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, Clock, CheckCircle, KeyRound, FolderKanban, Search, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { exportAccessReportPDF } from '@/lib/exportPdf'

export default function AccessControl() {
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [accessRecords, setAccessRecords] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const [approvalUser, setApprovalUser] = useState<any>(null)
  const [editProjectsUser, setEditProjectsUser] = useState<any>(null)

  const [selectedRole, setSelectedRole] = useState('Visitante')
  const [codigo, setCodigo] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activateNow, setActivateNow] = useState(true)

  // Map of projectId -> accessLevel
  const [selectedAccesses, setSelectedAccesses] = useState<Record<string, string>>({})
  const [projectSearch, setProjectSearch] = useState('')

  const loadData = async () => {
    try {
      const [usersRes, projectsRes, accessRes, settingsRes] = await Promise.all([
        pb.collection('users').getFullList({ sort: '-created' }),
        pb.collection('projects').getFullList({ sort: 'name', filter: 'status != "Concluído"' }),
        pb.collection('user_project_access').getFullList({ expand: 'project' }),
        pb.collection('company_settings').getFullList(),
      ])
      setUsers(usersRes)
      setProjects(projectsRes)
      setAccessRecords(accessRes)
      if (settingsRes.length > 0) setSettings(settingsRes[0])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())
  useRealtime('user_project_access', () => loadData())

  const pendingUsers = useMemo(() => users.filter((u) => u.status === 'Pendente'), [users])
  const activeUsers = useMemo(() => users.filter((u) => u.status !== 'Pendente'), [users])

  const handleUpdateUser = async (userId: string, data: any, successMsg: string) => {
    try {
      await pb.collection('users').update(userId, data)
      toast({ title: 'Sucesso', description: successMsg })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar registro.', variant: 'destructive' })
    }
  }

  const handleAdminReset = async (user: any) => {
    try {
      await pb.collection('users').requestPasswordReset(user.email)
      await pb.collection('audit_logs').create({
        user_id: user.id,
        action: 'password_reset_request',
        resource: 'users',
        details: { method: 'admin_reset', triggered_by: currentUser?.id },
      })
      toast({ title: 'Sucesso', description: `Link de redefinição enviado para ${user.email}` })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar link de redefinição.',
        variant: 'destructive',
      })
    }
  }

  const openApproval = (user: any) => {
    setApprovalUser(user)
    setSelectedRole(user.role || 'Visitante')
    setCodigo(user.codigo?.startsWith('TEMP') ? '' : user.codigo || '')
    setTempPassword(Math.random().toString(36).slice(-8) + 'A1!')
    setActivateNow(true)

    const userAcc = accessRecords.filter((a) => a.user === user.id)
    const accMap: Record<string, string> = {}
    userAcc.forEach((a) => (accMap[a.project] = a.access_level))
    setSelectedAccesses(accMap)

    setProjectSearch('')
  }

  const openEditProjects = (user: any) => {
    setEditProjectsUser(user)
    const userAcc = accessRecords.filter((a) => a.user === user.id)
    const accMap: Record<string, string> = {}
    userAcc.forEach((a) => (accMap[a.project] = a.access_level))
    setSelectedAccesses(accMap)
    setProjectSearch('')
  }

  const saveAccesses = async (userId: string) => {
    const existing = accessRecords.filter((a) => a.user === userId)

    const toDelete = existing.filter((e) => !selectedAccesses[e.project])
    const toUpdate = existing.filter(
      (e) => selectedAccesses[e.project] && e.access_level !== selectedAccesses[e.project],
    )
    const toCreateKeys = Object.keys(selectedAccesses).filter(
      (pid) => !existing.some((e) => e.project === pid),
    )

    for (const del of toDelete) {
      await pb.collection('user_project_access').delete(del.id)
    }
    for (const upd of toUpdate) {
      await pb
        .collection('user_project_access')
        .update(upd.id, { access_level: selectedAccesses[upd.project] })
    }
    for (const pid of toCreateKeys) {
      await pb.collection('user_project_access').create({
        user: userId,
        project: pid,
        access_level: selectedAccesses[pid],
      })
    }

    // Keep backwards compatibility
    await pb.collection('users').update(userId, {
      assigned_projects: Object.keys(selectedAccesses),
    })
  }

  const submitApproval = async () => {
    if (!codigo.trim()) {
      toast({ title: 'Erro', description: 'Código é obrigatório.', variant: 'destructive' })
      return
    }
    if (!tempPassword || tempPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'Senha provisória deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    setIsSubmitting(true)
    try {
      await pb.collection('users').update(approvalUser.id, {
        status: activateNow ? 'Ativo' : 'Pendente',
        role: selectedRole,
        codigo: codigo.trim(),
        password: tempPassword,
        passwordConfirm: tempPassword,
        must_change_password: true,
      })
      await saveAccesses(approvalUser.id)

      toast({ title: 'Sucesso', description: 'Usuário aprovado e ativado com projetos definidos.' })
      setApprovalUser(null)
      loadData()
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (errors.codigo) {
        toast({
          title: 'Erro',
          description: 'Este código já está em uso por outro usuário.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Erro', description: 'Falha ao aprovar usuário.', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitEditProjects = async () => {
    setIsSubmitting(true)
    try {
      await saveAccesses(editProjectsUser.id)
      toast({ title: 'Sucesso', description: 'Projetos associados atualizados com sucesso.' })
      setEditProjectsUser(null)
      loadData()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar projetos.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportAccessReport = () => {
    exportAccessReportPDF(
      users,
      accessRecords,
      projects,
      currentUser?.name || currentUser?.email || 'Administrador',
      settings,
    )
  }

  const ProjectSelector = ({ isDarkTheme = false }: { isDarkTheme?: boolean }) => {
    const filtered = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.client?.toLowerCase().includes(projectSearch.toLowerCase()),
    )

    return (
      <div className="space-y-3 mt-4">
        <Label className={isDarkTheme ? 'text-zinc-200' : ''}>Projetos Associados</Label>
        <div className="relative">
          <Search
            className={`absolute left-2.5 top-2.5 h-4 w-4 ${isDarkTheme ? 'text-amber-500/70' : 'text-muted-foreground'}`}
          />
          <Input
            placeholder="Buscar projetos..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className={`pl-9 ${isDarkTheme ? 'bg-zinc-900/50 border-amber-500/20 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500 hover:border-amber-500/40 transition-colors' : ''}`}
          />
        </div>
        <div
          className={`border rounded-lg p-1.5 max-h-64 overflow-y-auto ${isDarkTheme ? 'bg-zinc-900/40 backdrop-blur-md border-amber-500/20 custom-scrollbar' : 'bg-muted/10'}`}
        >
          {filtered.map((project) => {
            const isSelected = !!selectedAccesses[project.id]
            const accessLevel = selectedAccesses[project.id] || 'Leitura'
            return (
              <div
                key={project.id}
                className={`flex items-center justify-between p-2.5 rounded-md transition-colors ${isDarkTheme ? 'hover:bg-zinc-800/60 border border-transparent hover:border-amber-500/10' : 'hover:bg-muted/50'}`}
              >
                <label className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Checkbox
                    className={
                      isDarkTheme
                        ? 'border-amber-500/30 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-zinc-950'
                        : ''
                    }
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAccesses((prev) => ({ ...prev, [project.id]: 'Leitura' }))
                      } else {
                        const next = { ...selectedAccesses }
                        delete next[project.id]
                        setSelectedAccesses(next)
                      }
                    }}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium leading-none ${isDarkTheme ? 'text-zinc-200' : ''}`}
                    >
                      {project.name}
                    </span>
                    <span
                      className={`text-[10px] mt-1 uppercase tracking-wider ${isDarkTheme ? 'text-zinc-500' : 'text-muted-foreground'}`}
                    >
                      {project.client} • {project.status}
                    </span>
                  </div>
                </label>

                {isSelected && (
                  <Select
                    value={accessLevel}
                    onValueChange={(val) =>
                      setSelectedAccesses((prev) => ({ ...prev, [project.id]: val }))
                    }
                  >
                    <SelectTrigger
                      className={`h-8 w-[100px] text-xs ${isDarkTheme ? 'bg-zinc-900/80 border-amber-500/30 text-amber-500 focus:ring-amber-500 hover:border-amber-500 transition-colors' : ''}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className={
                        isDarkTheme
                          ? 'bg-zinc-900/95 backdrop-blur-xl border-amber-500/20 text-zinc-200'
                          : ''
                      }
                    >
                      <SelectItem
                        value="Leitura"
                        className={
                          isDarkTheme
                            ? 'focus:bg-amber-500/20 focus:text-amber-500 cursor-pointer'
                            : ''
                        }
                      >
                        Leitura
                      </SelectItem>
                      <SelectItem
                        value="Edição"
                        className={
                          isDarkTheme
                            ? 'focus:bg-amber-500/20 focus:text-amber-500 cursor-pointer'
                            : ''
                        }
                      >
                        Edição
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p
              className={`text-sm p-4 text-center ${isDarkTheme ? 'text-zinc-500' : 'text-muted-foreground'}`}
            >
              Nenhum projeto encontrado.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> Controle de Acesso
          </h1>
          <p className="text-muted-foreground">
            Gerencie os níveis de acesso e aprovações de novos usuários na plataforma.
          </p>
        </div>

        <Button
          onClick={handleExportAccessReport}
          variant="outline"
          className="shrink-0 bg-white border-amber-500/30 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:bg-zinc-950 dark:border-amber-500/30 dark:text-amber-500 dark:hover:bg-zinc-900 dark:hover:text-amber-400"
        >
          <FileText className="h-4 w-4 mr-2" /> Exportar Relatório de Acessos
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active" className="flex gap-2">
            <CheckCircle className="h-4 w-4" /> Usuários Registrados
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="h-4 w-4" /> Aguardando Aprovação
            {pendingUsers.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projetos Associados</TableHead>
                  {currentUser?.role === 'Administrador' && (
                    <TableHead className="text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers.map((u) => {
                  const userAccs = accessRecords.filter((a) => a.user === u.id)
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role || 'Visitante'}
                          onValueChange={(val) =>
                            handleUpdateUser(u.id, { role: val }, 'Nível de acesso atualizado.')
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                            <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                            <SelectItem value="Projetista">Projetista</SelectItem>
                            <SelectItem value="Estagiário">Estagiário</SelectItem>
                            <SelectItem value="Visitante">Visitante</SelectItem>
                            <SelectItem value="Cliente">Cliente</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.status || 'Ativo'}
                          onValueChange={(val) =>
                            handleUpdateUser(u.id, { status: val }, 'Status atualizado.')
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                            <SelectItem value="Em Férias">Em Férias</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {userAccs.length > 0 ? (
                            <>
                              {userAccs.slice(0, 2).map((a: any) => (
                                <Badge
                                  key={a.id}
                                  variant="outline"
                                  className="bg-zinc-900/80 backdrop-blur-md text-amber-500 border-amber-500/30 truncate max-w-[120px] hover:border-amber-500 transition-colors"
                                  title={`${a.expand?.project?.name} - ${a.access_level}`}
                                >
                                  {a.expand?.project?.name} (
                                  {a.access_level === 'Edição' ? 'Ed' : 'Leit'})
                                </Badge>
                              ))}
                              {userAccs.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="bg-zinc-800/80 backdrop-blur-md text-zinc-400 border-zinc-700"
                                >
                                  +{userAccs.length - 2}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">Nenhum</span>
                          )}
                        </div>
                      </TableCell>
                      {currentUser?.role === 'Administrador' && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditProjects(u)}
                              title="Gerenciar Projetos"
                              className="bg-zinc-900 text-amber-500 border-amber-500/30 hover:bg-zinc-800 hover:text-amber-400"
                            >
                              <FolderKanban className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleAdminReset(u)}
                              title="Enviar link de redefinição de senha"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
                {activeUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={currentUser?.role === 'Administrador' ? 6 : 5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil Solicitado</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || 'Sem nome'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{new Date(u.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openApproval(u)}>
                        Aprovar Acesso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum cadastro pendente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={!!approvalUser} onOpenChange={(open) => !open && setApprovalUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aprovar Acesso</DialogTitle>
            <DialogDescription>
              Defina as permissões e projetos para o usuário <strong>{approvalUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nível de Acesso (Role)</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Gerente de Projeto">Gerente de Projeto</SelectItem>
                    <SelectItem value="Projetista">Projetista</SelectItem>
                    <SelectItem value="Estagiário">Estagiário</SelectItem>
                    <SelectItem value="Visitante">Visitante</SelectItem>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Código (Único)</Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ex: TZZ-001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha Provisória</Label>
              <Input
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Senha temporária"
              />
              <p className="text-[10px] text-muted-foreground">
                Forçado a alterar no primeiro login.
              </p>
            </div>

            <ProjectSelector />

            <div className="flex items-center space-x-2 pt-2 border-t mt-4">
              <Switch id="activate" checked={activateNow} onCheckedChange={setActivateNow} />
              <Label htmlFor="activate" className="cursor-pointer">
                Ativar usuário imediatamente
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalUser(null)}>
              Cancelar
            </Button>
            <Button onClick={submitApproval} disabled={isSubmitting || !codigo.trim()}>
              {isSubmitting ? 'Salvando...' : 'Aprovar e Ativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Projects (Glassmorphism Premium) Dialog */}
      <Dialog open={!!editProjectsUser} onOpenChange={(open) => !open && setEditProjectsUser(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-900/80 border-amber-500/20 text-zinc-100 shadow-2xl shadow-black/80 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-amber-500 flex items-center gap-2">
              <FolderKanban className="h-5 w-5" /> Gestão de Projetos
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Gerencie os acessos do usuário <strong>{editProjectsUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ProjectSelector isDarkTheme={true} />
          </div>
          <DialogFooter className="border-t border-amber-500/20 pt-4 mt-2">
            <Button
              variant="ghost"
              className="text-zinc-300 hover:text-white hover:bg-zinc-800/50"
              onClick={() => setEditProjectsUser(null)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-amber-500 text-zinc-950 hover:bg-amber-600 font-semibold border border-transparent hover:border-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              onClick={submitEditProjects}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
