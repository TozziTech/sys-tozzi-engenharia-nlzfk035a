import { useEffect, useState, useMemo, Fragment } from 'react'
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
import {
  Shield,
  Clock,
  CheckCircle,
  KeyRound,
  Search,
  FileText,
  History,
  PieChart,
  FileStack,
  Settings,
  ClipboardList,
  Check,
  X,
  Eye,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { exportAccessReportPDF } from '@/lib/exportPdf'

const rbacResources = [
  { id: 'projects', name: 'Projetos' },
  { id: 'tasks', name: 'Tarefas' },
  { id: 'planilha_financeira', name: 'Módulo Financeiro' },
  { id: 'quotes', name: 'Orçamentos' },
  { id: 'clients', name: 'Clientes' },
  { id: 'contacts', name: 'Contatos' },
  { id: 'settings', name: 'Configurações do sistema' },
  { id: 'profile', name: 'Meu Perfil' },
  { id: 'dashboard_executivo', name: 'Dashboard Executivo' },
]

const rbacActions = [
  { id: 'view', name: 'Visualizar' },
  { id: 'create', name: 'Criar' },
  { id: 'edit', name: 'Editar' },
  { id: 'delete', name: 'Excluir' },
]

const moduleGroups = [
  {
    id: 'gestao_projetos',
    name: 'GESTÃO DE PROJETOS',
    desc: 'Projetos, Cronogramas e Calendários',
    children: [
      { id: 'dashboard_geral', name: 'Dashboard geral', desc: 'Visão geral de projetos' },
      { id: 'projetos', name: 'Projetos', desc: 'Gerenciamento de projetos' },
      { id: 'painel_cliente', name: 'Painel do cliente', desc: 'Visão do cliente' },
      { id: 'diagnostico', name: 'Diagnóstico', desc: 'Análise de gargalos' },
      { id: 'performance', name: 'Performance', desc: 'Desempenho de projetos' },
      { id: 'cronograma', name: 'Cronograma', desc: 'Gráfico de Gantt e prazos' },
      { id: 'auditoria_prazos', name: 'Auditoria de Prazos', desc: 'Controle de atrasos' },
      { id: 'calendario', name: 'Calendário', desc: 'Visão mensal de tarefas' },
    ],
  },
  {
    id: 'gestao_financeira',
    name: 'GESTÃO FINANCEIRA',
    desc: 'Financeiro, Orçamentos e Contratos',
    children: [
      {
        id: 'planilha_financeira',
        name: 'Módulo Financeiro',
        desc: 'Dashboard, Lançamentos e Planilha',
      },
      { id: 'orcamentos', name: 'Orçamentos', desc: 'Propostas comerciais' },
      { id: 'contratos', name: 'Contratos', desc: 'Gerador de contratos' },
      { id: 'contas_bancarias', name: 'Contas Bancárias', desc: 'Gestão de contas' },
    ],
  },
  {
    id: 'cadastro',
    name: 'CADASTRO',
    desc: 'Equipe, Clientes e Equipamentos',
    children: [
      { id: 'projetistas', name: 'Projetistas', desc: 'Membros da equipe' },
      { id: 'clientes', name: 'Clientes', desc: 'Base de clientes' },
      { id: 'contatos', name: 'Contatos', desc: 'Lista de contatos' },
      { id: 'equipamentos', name: 'Equipamentos', desc: 'Controle de ativos' },
    ],
  },
  {
    id: 'gestao_arq_doc',
    name: 'GESTÃO ARQ/DOC',
    desc: 'Gerenciamento de documentos, biblioteca e padrões',
    children: [
      { id: 'biblioteca', name: 'Biblioteca', desc: 'Livros e normas' },
      { id: 'pops', name: 'POPs', desc: 'Procedimentos Padrão' },
      { id: 'projetos_base', name: 'Projetos Base', desc: 'Templates' },
      { id: 'documentos_modelos', name: 'Documentos Modelos', desc: 'Ofícios' },
      { id: 'cursos', name: 'Cursos', desc: 'Treinamentos' },
    ],
  },
  {
    id: 'governanca',
    name: 'GOVERNANÇA E ADMIN',
    desc: 'Configurações de sistema e auditoria',
    children: [
      { id: 'controle_acesso', name: 'Controle de Acesso', desc: 'Gestão de permissões' },
      { id: 'visao_carteira', name: 'Visão Geral da Carteira', desc: 'Analytics global' },
      { id: 'dashboard_executivo', name: 'Dashboard Executivo', desc: 'Visão executiva' },
      { id: 'meu_perfil', name: 'Meu Perfil', desc: 'Gestão do perfil do usuário' },
      { id: 'configuracoes', name: 'Configurações do Sistema', desc: 'Ajustes do sistema' },
      { id: 'auditoria', name: 'Auditoria Executiva', desc: 'Logs do sistema' },
    ],
  },
]

const UserAccessCard = ({
  user,
  projects,
  accessRecords,
  setAccessRecords,
  handleUpdateUser,
  handleAdminReset,
}: any) => {
  const [search, setSearch] = useState('')
  const [loadingProjects, setLoadingProjects] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (p: any) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.client?.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  )

  const handleToggle = async (project: any, checked: boolean) => {
    if (loadingProjects[project.id]) return
    setLoadingProjects((prev) => ({ ...prev, [project.id]: true }))

    const existing = accessRecords.find(
      (a: any) =>
        (Array.isArray(a.user) ? a.user.includes(user.id) : a.user === user.id) &&
        (Array.isArray(a.project) ? a.project.includes(project.id) : a.project === project.id),
    )

    try {
      if (checked && !existing) {
        try {
          const newAccess = await pb.collection('user_project_access').create({
            user: user.id,
            project: project.id,
            access_level: 'Leitura',
          })

          if (setAccessRecords) {
            setAccessRecords((prev: any[]) => [...prev, newAccess])
          }

          const uRec = await pb.collection('users').getOne(user.id)
          const currentAssigned = Array.isArray(uRec.assigned_projects)
            ? uRec.assigned_projects
            : uRec.assigned_projects
              ? [uRec.assigned_projects]
              : []
          if (!currentAssigned.includes(project.id)) {
            await pb
              .collection('users')
              .update(user.id, { assigned_projects: [...currentAssigned, project.id] })
          }
          toast({
            title: 'Acesso concedido',
            description: `Acesso concedido para ${project.name}.`,
          })
        } catch (err: any) {
          if (err.status === 400) {
            const existingRecord = await pb
              .collection('user_project_access')
              .getFirstListItem(`user="${user.id}" && project="${project.id}"`)
              .catch(() => null)
            if (existingRecord && setAccessRecords) {
              setAccessRecords((prev: any[]) => {
                if (!prev.find((p) => p.id === existingRecord.id)) return [...prev, existingRecord]
                return prev
              })
            }
          } else {
            throw err
          }
        }
      } else if (!checked && existing) {
        try {
          await pb.collection('user_project_access').delete(existing.id)

          if (setAccessRecords) {
            setAccessRecords((prev: any[]) => prev.filter((a) => a.id !== existing.id))
          }

          const uRec = await pb.collection('users').getOne(user.id)
          const currentAssigned = Array.isArray(uRec.assigned_projects)
            ? uRec.assigned_projects
            : uRec.assigned_projects
              ? [uRec.assigned_projects]
              : []
          if (currentAssigned.includes(project.id)) {
            await pb.collection('users').update(user.id, {
              assigned_projects: currentAssigned.filter((id: string) => id !== project.id),
            })
          }
          toast({ title: 'Acesso revogado', description: `Acesso removido para ${project.name}.` })
        } catch (err: any) {
          if (err.status === 404) {
            if (setAccessRecords) {
              setAccessRecords((prev: any[]) => prev.filter((a) => a.id !== existing.id))
            }
          } else {
            throw err
          }
        }
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar acesso.', variant: 'destructive' })
    } finally {
      setLoadingProjects((prev) => ({ ...prev, [project.id]: false }))
    }
  }

  const handleLevelChange = async (project: any, level: string) => {
    if (loadingProjects[project.id]) return
    setLoadingProjects((prev) => ({ ...prev, [project.id]: true }))

    const existing = accessRecords.find(
      (a: any) =>
        (Array.isArray(a.user) ? a.user.includes(user.id) : a.user === user.id) &&
        (Array.isArray(a.project) ? a.project.includes(project.id) : a.project === project.id),
    )

    try {
      if (existing) {
        try {
          await pb.collection('user_project_access').update(existing.id, { access_level: level })

          if (setAccessRecords) {
            setAccessRecords((prev: any[]) =>
              prev.map((a) => (a.id === existing.id ? { ...a, access_level: level } : a)),
            )
          }

          toast({ title: 'Nível atualizado', description: `Acesso alterado para ${level}.` })
        } catch (err: any) {
          if (err.status === 404) {
            if (setAccessRecords) {
              setAccessRecords((prev: any[]) => prev.filter((a) => a.id !== existing.id))
            }
          } else {
            throw err
          }
        }
      } else {
        const newAccess = await pb.collection('user_project_access').create({
          user: user.id,
          project: project.id,
          access_level: level,
        })
        if (setAccessRecords) {
          setAccessRecords((prev: any[]) => [...prev, newAccess])
        }
        toast({ title: 'Nível atualizado', description: `Acesso alterado para ${level}.` })
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar nível.', variant: 'destructive' })
    } finally {
      setLoadingProjects((prev) => ({ ...prev, [project.id]: false }))
    }
  }

  return (
    <div className="flex flex-col border rounded-xl bg-card text-card-foreground shadow-sm h-[500px]">
      <div className="p-4 pb-3 border-b flex justify-between items-start">
        <div className="truncate pr-2">
          <h3 className="font-bold text-base truncate">{user.name || 'Sem nome'}</h3>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={() => handleAdminReset(user)}
          title="Redefinir Senha"
        >
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <div className="px-4 py-3 flex gap-2">
        <Select
          value={user.role || 'Visitante'}
          onValueChange={(val) => handleUpdateUser(user.id, { role: val }, 'Perfil atualizado.')}
        >
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
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
        <Select
          value={user.status || 'Ativo'}
          onValueChange={(val) => handleUpdateUser(user.id, { status: val }, 'Status atualizado.')}
        >
          <SelectTrigger className="h-8 text-xs w-[100px] flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
            <SelectItem value="Em Férias">Em Férias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-muted/5 rounded-b-xl">
        <Label className="text-sm font-semibold">Acesso aos Projetos</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background"
          />
        </div>
        <ScrollArea className="flex-1 border rounded-md bg-card/50">
          <div className="p-2 space-y-1">
            {filteredProjects.map((project: any) => {
              const existing = accessRecords.find(
                (a: any) =>
                  (Array.isArray(a.user) ? a.user.includes(user.id) : a.user === user.id) &&
                  (Array.isArray(a.project)
                    ? a.project.includes(project.id)
                    : a.project === project.id),
              )
              const isSelected = !!existing
              const accessLevel = existing?.access_level || 'Leitura'

              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/80 transition-colors"
                >
                  <label
                    className={`flex items-center space-x-3 flex-1 overflow-hidden ${loadingProjects[project.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Switch
                      checked={isSelected}
                      disabled={loadingProjects[project.id]}
                      onCheckedChange={(checked) => handleToggle(project, checked)}
                    />
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium leading-none truncate">
                        {project.name}
                      </span>
                      <span className="text-[10px] mt-1 uppercase tracking-wider text-muted-foreground truncate">
                        {project.client}
                      </span>
                    </div>
                  </label>
                  {isSelected && (
                    <Select
                      value={accessLevel}
                      onValueChange={(val) => handleLevelChange(project, val)}
                      disabled={loadingProjects[project.id]}
                    >
                      <SelectTrigger className="h-7 w-[85px] text-xs ml-2 flex-shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leitura">Leitura</SelectItem>
                        <SelectItem value="Edição">Edição</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })}
            {filteredProjects.length === 0 && (
              <p className="text-xs p-4 text-center text-muted-foreground">
                Nenhum projeto encontrado.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default function AccessControl() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [accessRecords, setAccessRecords] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [moduleVisibility, setModuleVisibility] = useState<any>({})
  const [rolePermissions, setRolePermissions] = useState<any>({})
  const [customRoles, setCustomRoles] = useState<any[]>([])
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [newRoleName, setNewRoleName] = useState('')

  const { toast } = useToast()

  const [approvalUser, setApprovalUser] = useState<any>(null)
  const [requestActionModal, setRequestActionModal] = useState<{
    req: any
    action: 'Aprovar' | 'Negar'
  } | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  const [selectedRole, setSelectedRole] = useState('Visitante')
  const [codigo, setCodigo] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activateNow, setActivateNow] = useState(true)

  const [selectedAccesses, setSelectedAccesses] = useState<Record<string, string>>({})
  const [projectSearch, setProjectSearch] = useState('')

  const loadData = async () => {
    try {
      const [usersRes, projectsRes, accessRes, settingsRes, reqsRes, auditRes, customRolesRes] =
        await Promise.all([
          pb.collection('users').getFullList({ sort: '-created' }),
          pb.collection('projects').getFullList({ sort: 'name', filter: 'status != "Concluído"' }),
          pb.collection('user_project_access').getFullList({ expand: 'project' }),
          pb.collection('company_settings').getFullList(),
          pb.collection('access_requests').getFullList({
            filter: 'status = "Pendente"',
            expand: 'user,project',
            sort: '-created',
          }),
          pb.collection('audit_logs').getFullList({
            filter: 'resource = "user_project_access"',
            expand: 'user_id',
            sort: '-created',
            limit: 100,
          }),
          pb.collection('custom_roles').getFullList({ sort: 'name' }),
        ])
      setUsers(usersRes)
      setProjects(projectsRes)
      setAccessRecords(accessRes)
      if (settingsRes.length > 0) {
        setSettings(settingsRes[0])
        setModuleVisibility(settingsRes[0].module_visibility || {})
        setRolePermissions(settingsRes[0].role_permissions || {})
      }
      setRequests(reqsRes)
      setAuditLogs(auditRes)
      setCustomRoles(customRolesRes)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('users', () => loadData())
  useRealtime('user_project_access', () => loadData())
  useRealtime('access_requests', () => loadData())
  useRealtime('audit_logs', () => loadData())
  useRealtime('custom_roles', () => loadData())

  const handleSaveCustomRole = async () => {
    if (!newRoleName.trim()) return
    try {
      if (editingRole) {
        await pb.collection('custom_roles').update(editingRole.id, { name: newRoleName })
        toast({ title: 'Sucesso', description: 'Perfil atualizado.' })
      } else {
        await pb.collection('custom_roles').create({ name: newRoleName, permissions: {} })
        toast({ title: 'Sucesso', description: 'Perfil criado com sucesso.' })
      }
      setRoleModalOpen(false)
      setEditingRole(null)
      setNewRoleName('')
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao salvar perfil.', variant: 'destructive' })
    }
  }

  const handleDeleteCustomRole = async (id: string) => {
    if (!confirm('Deseja realmente excluir este perfil?')) return
    try {
      await pb.collection('custom_roles').delete(id)
      toast({ title: 'Sucesso', description: 'Perfil excluído.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao excluir perfil.', variant: 'destructive' })
    }
  }

  const handleCustomRolePermissionChange = async (
    roleId: string,
    moduleId: string,
    value: string,
  ) => {
    const role = customRoles.find((r) => r.id === roleId)
    if (!role) return
    const newPerms = { ...(role.permissions || {}) }
    newPerms[moduleId] = value
    try {
      await pb.collection('custom_roles').update(roleId, { permissions: newPerms })
      toast({ title: 'Sucesso', description: 'Permissão atualizada.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar permissão.', variant: 'destructive' })
    }
  }

  const pendingUsers = useMemo(() => users.filter((u) => u.status === 'Pendente'), [users])
  const activeUsers = useMemo(
    () => users.filter((u) => u.status !== 'Pendente' && u.id !== currentUser?.id),
    [users, currentUser],
  )

  const totalActiveAccesses = accessRecords.length
  const totalPendingRequests = requests.length
  const totalEditors = accessRecords.filter((a) => a.access_level === 'Edição').length
  const totalReaders = accessRecords.filter((a) => a.access_level === 'Leitura').length

  const projectStats = useMemo(() => {
    return projects
      .map((p) => {
        const accesses = accessRecords.filter((a) =>
          Array.isArray(a.project) ? a.project.includes(p.id) : a.project === p.id,
        )
        const editors = accesses.filter((a) => a.access_level === 'Edição').length
        const readers = accesses.filter((a) => a.access_level === 'Leitura').length
        const projectReqs = requests.filter((r) =>
          Array.isArray(r.project) ? r.project.includes(p.id) : r.project === p.id,
        )
        const latestReq = projectReqs.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
        )[0]
        return { project: p, editors, readers, latestRequestStatus: latestReq?.status || 'Nenhuma' }
      })
      .sort((a, b) => b.editors + b.readers - (a.editors + a.readers))
  }, [projects, accessRecords, requests])

  const handleRBACChange = async (
    role: string,
    resource: string,
    action: string,
    checked: boolean,
  ) => {
    if (role === 'Administrador') return // Locked

    const permKey = `${resource}.${action}`
    const newPerms = { ...rolePermissions }
    if (!newPerms[role]) newPerms[role] = {}
    newPerms[role][permKey] = checked
    setRolePermissions(newPerms)

    if (settings) {
      try {
        await pb.collection('company_settings').update(settings.id, {
          role_permissions: newPerms,
        })
        toast({ title: 'Sucesso', description: 'Permissão atualizada.' })
      } catch (e) {
        toast({ title: 'Erro', description: 'Erro ao salvar permissão.', variant: 'destructive' })
      }
    }
  }

  const handleRolePermissionChange = async (role: string, moduleId: string, value: string) => {
    const newPerms = { ...rolePermissions }
    if (!newPerms[role]) newPerms[role] = {}
    newPerms[role][moduleId] = value
    setRolePermissions(newPerms)

    if (settings) {
      try {
        await pb.collection('company_settings').update(settings.id, {
          role_permissions: newPerms,
        })
        toast({ title: 'Sucesso', description: 'Permissão de perfil atualizada.' })
      } catch (e) {
        toast({
          title: 'Erro',
          description: 'Erro ao salvar permissão.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleModuleToggle = async (
    moduleId: string,
    checked: boolean,
    isParent: boolean = false,
    childrenIds: string[] = [],
    parentId?: string,
  ) => {
    const newVisibility = { ...moduleVisibility, [moduleId]: checked }
    if (isParent && !checked) {
      childrenIds.forEach((id) => {
        newVisibility[id] = false
      })
    } else if (!isParent && checked && parentId) {
      newVisibility[parentId] = true
    }

    setModuleVisibility(newVisibility)

    if (settings) {
      try {
        await pb.collection('company_settings').update(settings.id, {
          module_visibility: newVisibility,
        })
        toast({ title: 'Sucesso', description: 'Visibilidade de módulo atualizada.' })
      } catch (e) {
        toast({
          title: 'Erro',
          description: 'Erro ao salvar configuração.',
          variant: 'destructive',
        })
      }
    }
  }

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

  const handleProcessRequest = async () => {
    if (!requestActionModal?.req) return
    setIsSubmitting(true)
    try {
      const status = requestActionModal.action === 'Aprovar' ? 'Aprovado' : 'Negado'

      if (status === 'Aprovado') {
        const existingAccess = accessRecords.find(
          (a) =>
            (Array.isArray(a.user)
              ? a.user.includes(requestActionModal.req.user)
              : a.user === requestActionModal.req.user) &&
            (Array.isArray(a.project)
              ? a.project.includes(requestActionModal.req.project)
              : a.project === requestActionModal.req.project),
        )

        try {
          if (existingAccess) {
            await pb.collection('user_project_access').update(existingAccess.id, {
              access_level: requestActionModal.req.requested_level,
            })
          } else {
            await pb.collection('user_project_access').create({
              user: requestActionModal.req.user,
              project: requestActionModal.req.project,
              access_level: requestActionModal.req.requested_level,
            })
          }
        } catch (err: any) {
          if (err.status === 400) {
            // Already exists constraint violation
            const existRec = await pb
              .collection('user_project_access')
              .getFirstListItem(
                `user="${requestActionModal.req.user}" && project="${requestActionModal.req.project}"`,
              )
              .catch(() => null)
            if (existRec) {
              await pb.collection('user_project_access').update(existRec.id, {
                access_level: requestActionModal.req.requested_level,
              })
            }
          } else {
            throw err
          }
        }

        const userRec = users.find((u) => u.id === requestActionModal.req.user)
        if (userRec) {
          const currentAssigned = Array.isArray(userRec.assigned_projects)
            ? userRec.assigned_projects
            : userRec.assigned_projects
              ? [userRec.assigned_projects]
              : []
          if (!currentAssigned.includes(requestActionModal.req.project)) {
            await pb.collection('users').update(userRec.id, {
              assigned_projects: [...currentAssigned, requestActionModal.req.project],
            })
          }
        }
      }

      await pb.collection('access_requests').update(requestActionModal.req.id, {
        status,
        admin_notes: adminNotes,
      })
      toast({ title: 'Sucesso', description: `Solicitação ${status.toLowerCase()} com sucesso.` })
      setRequestActionModal(null)
      setAdminNotes('')
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao processar solicitação.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
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

  const saveAccesses = async (userId: string) => {
    const existing = accessRecords.filter((a) =>
      Array.isArray(a.user) ? a.user.includes(userId) : a.user === userId,
    )

    const getProjectFromAcc = (a: any) => (Array.isArray(a.project) ? a.project[0] : a.project)

    const toDelete = existing.filter((e) => !selectedAccesses[getProjectFromAcc(e)])
    const toUpdate = existing.filter(
      (e) =>
        selectedAccesses[getProjectFromAcc(e)] &&
        e.access_level !== selectedAccesses[getProjectFromAcc(e)],
    )
    const toCreateKeys = Object.keys(selectedAccesses).filter(
      (pid) => !existing.some((e) => getProjectFromAcc(e) === pid),
    )

    for (const del of toDelete) {
      try {
        await pb.collection('user_project_access').delete(del.id)
      } catch (err: any) {
        if (err.status !== 404) console.error(err)
      }
    }
    for (const upd of toUpdate) {
      try {
        await pb
          .collection('user_project_access')
          .update(upd.id, { access_level: selectedAccesses[getProjectFromAcc(upd)] })
      } catch (err: any) {
        if (err.status !== 404) console.error(err)
      }
    }
    for (const pid of toCreateKeys) {
      try {
        await pb.collection('user_project_access').create({
          user: userId,
          project: pid,
          access_level: selectedAccesses[pid],
        })
      } catch (err: any) {
        if (err.status === 400) {
          try {
            const existRec = await pb
              .collection('user_project_access')
              .getFirstListItem(`user="${userId}" && project="${pid}"`)
            if (existRec && existRec.access_level !== selectedAccesses[pid]) {
              await pb
                .collection('user_project_access')
                .update(existRec.id, { access_level: selectedAccesses[pid] })
            }
          } catch (e) {
            console.error(e)
          }
        } else {
          console.error(err)
        }
      }
    }
    await pb
      .collection('users')
      .update(userId, { assigned_projects: Object.keys(selectedAccesses) })
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
      await pb.send('/backend/v1/admin/update-user', {
        method: 'POST',
        body: JSON.stringify({
          id: approvalUser.id,
          status: activateNow ? 'Ativo' : 'Pendente',
          role: selectedRole,
          codigo: codigo.trim(),
          password: tempPassword,
          passwordConfirm: tempPassword,
          must_change_password: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      await saveAccesses(approvalUser.id)
      toast({ title: 'Sucesso', description: 'Usuário aprovado e ativado com projetos definidos.' })
      setApprovalUser(null)
    } catch (err: any) {
      const errors = extractFieldErrors(err)
      if (errors.codigo) {
        toast({ title: 'Erro', description: 'Este código já está em uso.', variant: 'destructive' })
      } else {
        toast({ title: 'Erro', description: 'Falha ao aprovar usuário.', variant: 'destructive' })
      }
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

  const ApprovalProjectSelector = () => {
    const filtered = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.client?.toLowerCase().includes(projectSearch.toLowerCase()),
    )

    const handleToggle = (project: any, checked: boolean) => {
      if (checked) {
        setSelectedAccesses((prev) => ({ ...prev, [project.id]: 'Leitura' }))
      } else {
        const next = { ...selectedAccesses }
        delete next[project.id]
        setSelectedAccesses(next)
      }
    }

    const handleLevelChange = (project: any, level: string) => {
      setSelectedAccesses((prev) => ({ ...prev, [project.id]: level }))
    }

    return (
      <div className="space-y-3 mt-4">
        <Label>Projetos Associados</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="border rounded-lg h-[250px] bg-muted/10">
          <div className="p-1.5 space-y-1">
            {filtered.map((project) => {
              const isSelected = !!selectedAccesses[project.id]
              const accessLevel = selectedAccesses[project.id] || 'Leitura'
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-2.5 rounded-md transition-colors hover:bg-muted/50"
                >
                  <label className="flex items-center space-x-3 cursor-pointer flex-1">
                    <Switch
                      checked={isSelected}
                      onCheckedChange={(checked) => handleToggle(project, checked)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-none">{project.name}</span>
                      <span className="text-[10px] mt-1 uppercase tracking-wider text-muted-foreground">
                        {project.client} • {project.status}
                      </span>
                    </div>
                  </label>
                  {isSelected && (
                    <Select
                      value={accessLevel}
                      onValueChange={(val) => handleLevelChange(project, val)}
                    >
                      <SelectTrigger className="h-8 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leitura">Leitura</SelectItem>
                        <SelectItem value="Edição">Edição</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm p-4 text-center text-muted-foreground">
                Nenhum projeto encontrado.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (currentUser?.role !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-amber-500 flex items-center gap-2">
            <Shield className="h-8 w-8 text-amber-500" /> Controle de Acesso
          </h1>
          <p className="text-muted-foreground">
            Gerencie acessos, aprovações e auditoria na plataforma.
          </p>
        </div>
        <Button
          onClick={handleExportAccessReport}
          variant="outline"
          className="bg-white border-amber-500/30 text-amber-700 hover:bg-amber-50 dark:bg-zinc-950 dark:border-amber-500/30 dark:text-amber-500 dark:hover:bg-zinc-900"
        >
          <FileText className="h-4 w-4 mr-2" /> Exportar Relatório
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dashboard" className="flex gap-2">
            <PieChart className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="custom_roles" className="flex gap-2">
            <Shield className="h-4 w-4" /> Perfis Customizados
          </TabsTrigger>
          <TabsTrigger value="active" className="flex gap-2">
            <CheckCircle className="h-4 w-4" /> Usuários Ativos
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="h-4 w-4" /> Aprovações
            {pendingUsers.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex gap-2">
            <KeyRound className="h-4 w-4" /> Solicitações
            {requests.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white dark:text-zinc-950 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex gap-2">
            <Settings className="h-4 w-4" /> Módulos
          </TabsTrigger>
          <TabsTrigger value="rbac" className="flex gap-2">
            <KeyRound className="h-4 w-4" /> Permissões (RBAC)
          </TabsTrigger>
          <TabsTrigger value="audit_report" className="flex gap-2">
            <ClipboardList className="h-4 w-4" /> Relatório de Auditoria
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Acessos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalActiveAccesses}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de permissões concedidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Solicitações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalPendingRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">Aguardando aprovação</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Distribuição Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-blue-600">{totalReaders}</div>
                    <div className="text-xs text-muted-foreground uppercase">Leitura</div>
                  </div>
                  <div className="h-8 w-[1px] bg-border" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-amber-600">{totalEditors}</div>
                    <div className="text-xs text-muted-foreground uppercase">Edição</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Segurança por Projeto</CardTitle>
              <CardDescription>
                Resumo de permissões e solicitações recentes em projetos ativos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto</TableHead>
                      <TableHead className="text-center">Usuários c/ Edição</TableHead>
                      <TableHead className="text-center">Usuários c/ Leitura</TableHead>
                      <TableHead>Última Solicitação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectStats.map((stat) => (
                      <TableRow key={stat.project.id}>
                        <TableCell className="font-medium">{stat.project.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          >
                            {stat.editors}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                          >
                            {stat.readers}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {stat.latestRequestStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {projectStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Nenhum projeto encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeUsers.map((u) => (
              <UserAccessCard
                key={u.id}
                user={u}
                projects={projects}
                accessRecords={accessRecords}
                setAccessRecords={setAccessRecords}
                handleUpdateUser={handleUpdateUser}
                handleAdminReset={handleAdminReset}
              />
            ))}
            {activeUsers.length === 0 && (
              <div className="col-span-full text-center py-12 bg-card rounded-xl border border-dashed">
                <p className="text-muted-foreground">Nenhum usuário ativo encontrado.</p>
              </div>
            )}
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

        <TabsContent value="requests">
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Nível Solicitado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{new Date(req.created).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">
                      {req.expand?.user?.name || req.expand?.user?.email}
                    </TableCell>
                    <TableCell>{req.expand?.project?.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/30"
                      >
                        {req.requested_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-500 dark:hover:bg-red-500/10"
                          onClick={() => setRequestActionModal({ req, action: 'Negar' })}
                        >
                          Negar
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 bg-amber-500 text-white hover:bg-amber-600 dark:text-zinc-950 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                          onClick={() => setRequestActionModal({ req, action: 'Aprovar' })}
                        >
                          Aprovar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma solicitação pendente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="custom_roles" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  Perfis Customizados
                </CardTitle>
                <CardDescription>
                  Crie níveis de acesso personalizados. Vá até a aba "Módulos" para configurar as
                  permissões de cada perfil.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingRole(null)
                  setNewRoleName('')
                  setRoleModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Criar Perfil
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Perfil</TableHead>
                      <TableHead className="w-[150px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customRoles.map((cr) => (
                      <TableRow key={cr.id}>
                        <TableCell className="font-medium">{cr.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRole(cr)
                              setNewRoleName(cr.name)
                              setRoleModalOpen(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteCustomRole(cr.id)}
                          >
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {customRoles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                          Nenhum perfil customizado encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileStack className="h-5 w-5 text-amber-500" />
                Gerenciamento de Módulos
              </CardTitle>
              <CardDescription>
                Ative ou desative módulos globalmente. Desativar um módulo principal ocultará todos
                os seus submódulos para todos os usuários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-6">
                  {moduleGroups.map((group) => (
                    <div key={group.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 p-4 border-b flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">{group.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{group.desc}</p>
                        </div>
                        <Switch
                          checked={moduleVisibility[group.id] !== false}
                          onCheckedChange={(c) =>
                            handleModuleToggle(
                              group.id,
                              c,
                              true,
                              group.children.map((ch) => ch.id),
                            )
                          }
                        />
                      </div>

                      <div className="p-4 bg-card border-t">
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="w-[200px]">Módulo / Global</TableHead>
                                {[
                                  'Gerente de Projeto',
                                  'Projetista',
                                  'Estagiário',
                                  'Visitante',
                                  'Cliente',
                                ].map((role) => (
                                  <TableHead
                                    key={role}
                                    className="text-center font-semibold text-xs whitespace-nowrap px-2"
                                  >
                                    {role}
                                  </TableHead>
                                ))}
                                {customRoles.map((cr) => (
                                  <TableHead
                                    key={cr.id}
                                    className="text-center font-semibold text-xs whitespace-nowrap px-2 text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                                  >
                                    {cr.name}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.children.map((mod) => (
                                <TableRow key={mod.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex flex-col gap-2">
                                      <div>
                                        <span className="text-sm block">{mod.name}</span>
                                        <span className="text-[10px] text-muted-foreground block">
                                          {mod.desc}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={moduleVisibility[mod.id] !== false}
                                          disabled={moduleVisibility[group.id] === false}
                                          onCheckedChange={(c) =>
                                            handleModuleToggle(mod.id, c, false, [], group.id)
                                          }
                                          className="scale-75 origin-left"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                          Global Ativo
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  {[
                                    'Gerente de Projeto',
                                    'Projetista',
                                    'Estagiário',
                                    'Visitante',
                                    'Cliente',
                                  ].map((role) => {
                                    const val = rolePermissions[role]?.[mod.id] || 'Ativo'
                                    return (
                                      <TableCell
                                        key={role}
                                        className="text-center p-2 align-top pt-4"
                                      >
                                        <Select
                                          value={val}
                                          disabled={
                                            moduleVisibility[mod.id] === false ||
                                            moduleVisibility[group.id] === false
                                          }
                                          onValueChange={(v) =>
                                            handleRolePermissionChange(role, mod.id, v)
                                          }
                                        >
                                          <SelectTrigger className="h-8 text-xs w-[95px] mx-auto">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Ativo">Ativo</SelectItem>
                                            <SelectItem value="Leitura">Leitura</SelectItem>
                                            <SelectItem value="Inativo">Inativo</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    )
                                  })}
                                  {customRoles.map((cr) => {
                                    const val =
                                      cr.permissions && cr.permissions[mod.id]
                                        ? cr.permissions[mod.id]
                                        : 'Ativo'
                                    return (
                                      <TableCell
                                        key={cr.id}
                                        className="text-center p-2 align-top pt-4 bg-amber-50/30 dark:bg-amber-950/10"
                                      >
                                        <Select
                                          value={val}
                                          disabled={
                                            moduleVisibility[mod.id] === false ||
                                            moduleVisibility[group.id] === false
                                          }
                                          onValueChange={(v) =>
                                            handleCustomRolePermissionChange(cr.id, mod.id, v)
                                          }
                                        >
                                          <SelectTrigger className="h-8 text-xs w-[95px] mx-auto border-amber-200 dark:border-amber-800">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Ativo">Ativo</SelectItem>
                                            <SelectItem value="Leitura">Leitura</SelectItem>
                                            <SelectItem value="Inativo">Inativo</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    )
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground italic mt-3 px-2">
                    Nota: Administradores possuem acesso "Total" por padrão em todos os módulos do
                    sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbac" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                Matriz de Permissões (RBAC)
              </CardTitle>
              <CardDescription>
                Configure as ações permitidas para cada perfil de usuário no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden bg-card overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[250px] font-semibold">Ação / Recurso</TableHead>
                      {[
                        'Administrador',
                        'Gerente de Projeto',
                        'Projetista',
                        'Estagiário',
                        'Visitante',
                        'Cliente',
                      ].map((role) => (
                        <TableHead
                          key={role}
                          className="text-center font-semibold text-xs whitespace-nowrap"
                        >
                          {role}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rbacResources.map((resource) => (
                      <Fragment key={resource.id}>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell
                            colSpan={7}
                            className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-2"
                          >
                            {resource.name}
                          </TableCell>
                        </TableRow>
                        {rbacActions.map((action) => (
                          <TableRow key={`${resource.id}-${action.id}`}>
                            <TableCell className="pl-6 font-medium text-sm">
                              {action.name} {resource.name}
                            </TableCell>
                            {[
                              'Administrador',
                              'Gerente de Projeto',
                              'Projetista',
                              'Estagiário',
                              'Visitante',
                              'Cliente',
                            ].map((role) => {
                              const isLocked = role === 'Administrador'
                              const permKey = `${resource.id}.${action.id}`

                              let defaultChecked = false
                              if (isLocked) defaultChecked = true
                              else if (role === 'Gerente de Projeto') defaultChecked = true
                              else if (action.id === 'view') defaultChecked = true

                              const val = rolePermissions[role]?.[permKey]
                              const isChecked = val !== undefined ? val === true : defaultChecked

                              return (
                                <TableCell
                                  key={`${resource.id}-${action.id}-${role}`}
                                  className="text-center"
                                >
                                  <div className="flex justify-center">
                                    <Switch
                                      checked={isChecked}
                                      disabled={isLocked}
                                      onCheckedChange={(c) =>
                                        handleRBACChange(role, resource.id, action.id, c)
                                      }
                                    />
                                  </div>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit_report" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-500" />
                Relatório de Auditoria de Acessos
              </CardTitle>
              <CardDescription>
                Visão consolidada das permissões de acesso por perfil e módulo do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden bg-card overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[250px] font-semibold">Módulo / Submódulo</TableHead>
                      {[
                        'Administrador',
                        'Gerente de Projeto',
                        'Projetista',
                        'Estagiário',
                        'Visitante',
                        'Cliente',
                      ].map((role) => (
                        <TableHead
                          key={role}
                          className="text-center font-semibold text-xs whitespace-nowrap"
                        >
                          {role}
                        </TableHead>
                      ))}
                      {customRoles.map((cr) => (
                        <TableHead
                          key={cr.id}
                          className="text-center font-semibold text-xs whitespace-nowrap text-amber-600 px-2"
                        >
                          {cr.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moduleGroups.map((group) => {
                      const isGroupDisabled = moduleVisibility[group.id] === false
                      return (
                        <Fragment key={group.id}>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell
                              colSpan={7}
                              className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-2"
                            >
                              {group.name}{' '}
                              {isGroupDisabled && (
                                <span className="text-red-500 normal-case tracking-normal ml-2 font-normal text-[10px]">
                                  (Oculto Globalmente)
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                          {group.children.map((mod) => {
                            const isModDisabled =
                              isGroupDisabled || moduleVisibility[mod.id] === false

                            return (
                              <TableRow key={mod.id}>
                                <TableCell className="pl-6 font-medium text-sm">
                                  {mod.name}
                                </TableCell>
                                {[
                                  'Administrador',
                                  'Gerente de Projeto',
                                  'Projetista',
                                  'Estagiário',
                                  'Visitante',
                                  'Cliente',
                                ].map((role) => {
                                  let status = 'Ativo'

                                  if (role === 'Administrador') {
                                    status = 'Total'
                                  } else if (isModDisabled) {
                                    status = 'Oculto'
                                  } else {
                                    status = rolePermissions[role]?.[mod.id] || 'Ativo'
                                  }

                                  return (
                                    <TableCell
                                      key={`${mod.id}-${role}`}
                                      className="text-center py-2"
                                    >
                                      {status === 'Total' && (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 whitespace-nowrap"
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Total
                                        </Badge>
                                      )}
                                      {status === 'Ativo' && (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 whitespace-nowrap"
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Ativo
                                        </Badge>
                                      )}
                                      {status === 'Leitura' && (
                                        <Badge
                                          variant="outline"
                                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 whitespace-nowrap"
                                        >
                                          <Eye className="h-3 w-3 mr-1" /> Leitura
                                        </Badge>
                                      )}
                                      {(status === 'Inativo' || status === 'Oculto') && (
                                        <Badge
                                          variant="outline"
                                          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 whitespace-nowrap"
                                        >
                                          <X className="h-3 w-3 mr-1" /> {status}
                                        </Badge>
                                      )}
                                    </TableCell>
                                  )
                                })}
                                {customRoles.map((cr) => {
                                  let status = 'Ativo'
                                  if (isModDisabled) {
                                    status = 'Oculto'
                                  } else {
                                    status =
                                      cr.permissions && cr.permissions[mod.id]
                                        ? cr.permissions[mod.id]
                                        : 'Ativo'
                                  }
                                  return (
                                    <TableCell
                                      key={`${mod.id}-${cr.id}`}
                                      className="text-center py-2 bg-amber-50/20 dark:bg-amber-950/10"
                                    >
                                      {status === 'Ativo' && (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 whitespace-nowrap"
                                        >
                                          <Check className="h-3 w-3 mr-1" /> Ativo
                                        </Badge>
                                      )}
                                      {status === 'Leitura' && (
                                        <Badge
                                          variant="outline"
                                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 whitespace-nowrap"
                                        >
                                          <Eye className="h-3 w-3 mr-1" /> Leitura
                                        </Badge>
                                      )}
                                      {(status === 'Inativo' || status === 'Oculto') && (
                                        <Badge
                                          variant="outline"
                                          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 whitespace-nowrap"
                                        >
                                          <X className="h-3 w-3 mr-1" /> {status}
                                        </Badge>
                                      )}
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            )
                          })}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {' '}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Colaborador Afetado</TableHead>
                  <TableHead>Executado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => {
                  const targetUser = users.find((u) => u.id === log.details?.target_user)
                  const actionLabel =
                    log.action === 'access_granted'
                      ? 'Acesso Concedido'
                      : log.action === 'access_updated'
                        ? 'Acesso Atualizado'
                        : 'Acesso Revogado'
                  const actionColor =
                    log.action === 'access_granted'
                      ? 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20'
                      : log.action === 'access_updated'
                        ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20'
                        : 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20'

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.created).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionColor}>
                          {actionLabel}{' '}
                          {log.details?.access_level ? `(${log.details.access_level})` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.details?.project_name}</TableCell>
                      <TableCell>{targetUser?.name || 'Usuário Desconhecido'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.expand?.user_id?.name || 'Sistema'}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {auditLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!approvalUser} onOpenChange={(open) => !open && setApprovalUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aprovar Acesso</DialogTitle>
            <DialogDescription>
              Defina as permissões para o usuário <strong>{approvalUser?.name}</strong>.
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
              <Input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">
                Forçado a alterar no primeiro login.
              </p>
            </div>
            <ApprovalProjectSelector />
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

      <Dialog
        open={!!requestActionModal}
        onOpenChange={(open) => !open && setRequestActionModal(null)}
      >
        <DialogContent className="bg-white dark:bg-zinc-950 border-amber-500/20 dark:text-zinc-100 shadow-2xl dark:shadow-black/80">
          <DialogHeader>
            <DialogTitle
              className={
                requestActionModal?.action === 'Aprovar'
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-red-600 dark:text-red-500'
              }
            >
              {requestActionModal?.action} Solicitação
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-zinc-400">
              {requestActionModal?.action === 'Aprovar'
                ? `Confirmar acesso de ${requestActionModal?.req?.requested_level} para ${requestActionModal?.req?.expand?.user?.name} no projeto ${requestActionModal?.req?.expand?.project?.name}?`
                : `Você está negando o acesso de ${requestActionModal?.req?.expand?.user?.name} ao projeto ${requestActionModal?.req?.expand?.project?.name}.`}
            </DialogDescription>
          </DialogHeader>
          {requestActionModal?.action === 'Negar' && (
            <div className="space-y-2 py-4">
              <Label className="text-slate-700 dark:text-zinc-300">Motivo (Opcional)</Label>
              <Input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ex: Acesso restrito a gerentes."
                className="dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 focus-visible:ring-amber-500"
              />
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 dark:border-amber-500/20 pt-4 mt-2">
            <Button
              variant="ghost"
              onClick={() => setRequestActionModal(null)}
              className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessRequest}
              disabled={isSubmitting}
              className={
                requestActionModal?.action === 'Aprovar'
                  ? 'bg-amber-500 text-white dark:text-zinc-950 hover:bg-amber-600'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
            >
              {isSubmitting ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Perfil' : 'Criar Novo Perfil Customizado'}
            </DialogTitle>
            <DialogDescription>
              Defina o nome do perfil customizado. As permissões de acesso por módulo devem ser
              configuradas na aba "Módulos".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Perfil</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Ex: Analista Financeiro"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustomRole} disabled={!newRoleName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
