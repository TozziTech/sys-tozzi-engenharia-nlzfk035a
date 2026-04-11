import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { addDays, subDays, format } from 'date-fns'
import {
  Project,
  User,
  Comment,
  AppNotification,
  TimeLog as BaseTimeLog,
  Task,
  Transaction,
  ExpenseCategory,
  AuditLog,
  AuditLogChange,
} from '@/types/project'
import { sendSlackNotification } from '@/lib/slack'

export const MOCK_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat1', name: 'Marketing', color: 'hsl(var(--chart-1))' },
  { id: 'cat2', name: 'Desenvolvimento', color: 'hsl(var(--chart-2))' },
  { id: 'cat3', name: 'Infraestrutura', color: 'hsl(var(--chart-3))' },
]

const today = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

export type AppTimeLog = BaseTimeLog & {
  status: 'Pending' | 'Approved' | 'Rejected'
}

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'João Carlos',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
    role: 'Gerente de Projeto',
    hourlyRate: 80,
    assignedProjects: ['1', '2', '3', '4', '5', '6'],
  },
  {
    id: '2',
    name: 'Ana Silva',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
    role: 'Projetista',
    hourlyRate: 45,
    assignedProjects: ['1', '2'],
  },
  {
    id: '3',
    name: 'Marcos Paulo',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
    role: 'Administrador',
    hourlyRate: 100,
    assignedProjects: ['1', '3', '4'],
  },
]

export const MOCK_TASKS: Task[] = [
  { id: 't1', projectId: '1', name: 'Levantamento Arquitetônico' },
  { id: 't2', projectId: '1', name: 'Revisão de Estrutura de Concreto' },
  { id: 't3', projectId: '2', name: 'Cálculo Estrutural' },
  { id: 't4', projectId: '3', name: 'Projeto Luminotécnico' },
  { id: 't5', projectId: '4', name: 'Análise de Solo' },
]

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tr1',
    projectId: '1',
    description: 'Pagamento Inicial do Cliente',
    type: 'Entrada',
    value: 50000,
    date: new Date().toISOString(),
    status: 'Pago',
  },
  {
    id: 'tr2',
    projectId: '1',
    description: 'Compra de Materiais Diversos',
    type: 'Saída',
    value: 15000,
    date: subDays(new Date(), 2).toISOString(),
    categoryId: 'cat3',
    status: 'Pago',
  },
  {
    id: 'tr3',
    projectId: '1',
    description: 'Contratação de Topografia',
    type: 'Saída',
    value: 5000,
    date: subDays(new Date(), 5).toISOString(),
    categoryId: 'cat2',
    status: 'Pago',
  },
  {
    id: 'tr4',
    projectId: '2',
    description: 'Sinal de Aprovação',
    type: 'Entrada',
    value: 30000,
    date: subDays(new Date(), 10).toISOString(),
    status: 'Pago',
  },
  {
    id: 'tr5',
    projectId: '2',
    description: 'Taxas e Licenças',
    type: 'Saída',
    value: 2000,
    date: subDays(new Date(), 8).toISOString(),
    categoryId: 'cat3',
    status: 'Pendente',
  },
]

export const MOCK_TIME_LOGS: AppTimeLog[] = [
  {
    id: 'tl-1',
    projectId: '1',
    taskId: 't1',
    userId: '2',
    date: new Date().toISOString(),
    hours: 4,
    description: 'Levantamento de campo inicial',
    createdAt: new Date().toISOString(),
    status: 'Pending',
  } as AppTimeLog,
  {
    id: 'tl-2',
    projectId: '2',
    taskId: 't3',
    userId: '2',
    date: subDays(new Date(), 1).toISOString(),
    hours: 6,
    description: 'Cálculo estrutural da base',
    createdAt: subDays(new Date(), 1).toISOString(),
    status: 'Approved',
  } as AppTimeLog,
]

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    projectId: '1',
    author: MOCK_USERS[0],
    content:
      'Iniciando o levantamento arquitetônico amanhã. @Ana Silva consegue me enviar os documentos base?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    attachments: [{ id: 'a1', name: 'Cronograma_v1.pdf', url: '#', size: '1.4 MB' }],
  },
]

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Menção em Comentário',
    description: 'João Carlos mencionou você no projeto Edifício Aurora.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    link: '/projects/1',
  },
]

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Edifício Aurora',
    client: 'Construtora Alfa',
    discipline: 'Arquitetura',
    status: 'Em Andamento',
    startDate: fmt(subDays(today, 60)),
    endDate: fmt(addDays(today, 120)),
    progress: 65,
    engineer: 'Eng. Ricardo Silva',
    budget: 150000,
    spent: 45000,
    description: 'Projeto arquitetônico completo.',
  },
  {
    id: '2',
    name: 'Residência Silva',
    client: 'Família Silva',
    discipline: 'Estrutural',
    status: 'Concluído',
    startDate: fmt(subDays(today, 120)),
    endDate: fmt(subDays(today, 10)),
    progress: 100,
    engineer: 'Eng. Maria Santos',
    budget: 80000,
    spent: 80000,
  },
  {
    id: '3',
    name: 'Shopping Central',
    client: 'Iguatemi',
    discipline: 'Elétrico',
    status: 'Planejamento',
    startDate: fmt(subDays(today, 10)),
    endDate: fmt(addDays(today, 1)), // Vence em 1 dia (Crítico)
    progress: 10,
    engineer: 'Eng. Carlos Oliveira',
    budget: 350000,
    spent: 10000,
  },
  {
    id: '4',
    name: 'Ponte Sul',
    client: 'Prefeitura',
    discipline: 'Estrutural',
    status: 'Atrasado',
    startDate: fmt(subDays(today, 200)),
    endDate: fmt(subDays(today, 30)), // Atrasado (Crítico)
    progress: 80,
    engineer: 'Eng. Ricardo Silva',
    budget: 1200000,
    spent: 950000,
  },
  {
    id: '5',
    name: 'Condomínio Flores',
    client: 'Construtora Beta',
    discipline: 'Hidrossanitário',
    status: 'Em Andamento',
    startDate: fmt(subDays(today, 30)),
    endDate: fmt(addDays(today, 2)), // Vence em 2 dias (Crítico)
    progress: 30,
    engineer: 'Eng. Maria Santos',
    budget: 45000,
    spent: 15000,
  },
  {
    id: '6',
    name: 'Hospital São Lucas',
    client: 'Governo Estadual',
    discipline: 'Geotecnia',
    status: 'Em Andamento',
    startDate: fmt(subDays(today, 90)),
    endDate: fmt(addDays(today, 4)),
    progress: 35,
    engineer: 'Eng. Ana Costa',
    budget: 500000,
    spent: 200000,
  },
]

interface ProjectStore {
  projects: Project[]
  addProject: (p: Project) => void
  updateProject: (id: string, p: Partial<Project>) => void
  deleteProject: (id: string) => void

  comments: Comment[]
  addComment: (c: Comment) => void

  notifications: AppNotification[]
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void

  users: User[]
  updateUserRole: (id: string, role: User['role']) => void
  assignUserToProjects: (userId: string, projectIds: string[]) => void
  updateUserHourlyRate: (userId: string, rate: number) => void

  tasks: Task[]
  timeLogs: AppTimeLog[]
  addTimeLog: (log: Omit<AppTimeLog, 'id' | 'createdAt' | 'status'>) => void
  approveTimeLog: (id: string) => void
  rejectTimeLog: (id: string) => void

  isNewProjectModalOpen: boolean
  setNewProjectModalOpen: (open: boolean) => void
  globalSearch: string
  setGlobalSearch: (s: string) => void

  slackWebhookUrl: string
  setSlackWebhookUrl: (url: string) => void
  assignTask: (projectName: string, taskName: string, assigneeName: string) => void
  transactions: Transaction[]
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  categories: ExpenseCategory[]
  addCategory: (c: Omit<ExpenseCategory, 'id'>) => void
  deleteCategory: (id: string) => void

  auditLogs: AuditLog[]
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void
}

const ProjectContext = createContext<ProjectStore | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [tasks] = useState<Task[]>(MOCK_TASKS)
  const [timeLogs, setTimeLogs] = useState<AppTimeLog[]>(MOCK_TIME_LOGS)
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS)
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [slackWebhookUrl, setSlackWebhookUrlState] = useState(
    () => localStorage.getItem('slackWebhookUrl') || '',
  )
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [categories, setCategories] = useState<ExpenseCategory[]>(MOCK_CATEGORIES)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const hasCheckedAutomations = useRef(false)

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `al-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    }
    setAuditLogs((prev) => [newLog, ...prev])
  }, [])

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const id = `tr-${Date.now()}`
    setTransactions((prev) => [{ ...t, id }, ...prev])
    addAuditLog({
      user: { name: 'Admin User' },
      action: 'Create',
      entityType: 'Transaction',
      entityName: t.description,
      changes: [
        { field: 'Valor', newValue: String(t.value) },
        { field: 'Tipo', newValue: t.type },
      ],
    })
  }

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => {
      const oldTr = prev.find((t) => t.id === id)
      if (oldTr) {
        const changes: AuditLogChange[] = []
        Object.keys(data).forEach((k) => {
          const key = k as keyof Transaction
          if (data[key] !== oldTr[key] && data[key] !== undefined) {
            changes.push({
              field: key,
              oldValue: String(oldTr[key] || ''),
              newValue: String(data[key] || ''),
            })
          }
        })
        if (changes.length > 0) {
          addAuditLog({
            user: { name: 'Admin User' },
            action: 'Update',
            entityType: 'Transaction',
            entityName: oldTr.description,
            changes,
          })
        }
      }
      return prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    })
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => {
      const oldTr = prev.find((t) => t.id === id)
      if (oldTr) {
        addAuditLog({
          user: { name: 'Admin User' },
          action: 'Delete',
          entityType: 'Transaction',
          entityName: oldTr.description,
          changes: [],
        })
      }
      return prev.filter((tr) => tr.id !== id)
    })
  }

  const addCategory = (c: Omit<ExpenseCategory, 'id'>) => {
    setCategories((prev) => [...prev, { ...c, id: `cat-${Date.now()}` }])
  }

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
  }

  const setSlackWebhookUrl = (url: string) => {
    setSlackWebhookUrlState(url)
    localStorage.setItem('slackWebhookUrl', url)
  }

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `n-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [newNotif, ...prev])
  }, [])

  const addProject = (p: Project) => {
    setProjects((prev) => [p, ...prev])
    addAuditLog({
      user: { name: 'Admin User' },
      action: 'Create',
      entityType: 'Project',
      entityName: p.name,
      changes: [
        { field: 'Status', newValue: p.status },
        { field: 'Engenheiro', newValue: p.engineer },
      ],
    })
    sendSlackNotification(
      slackWebhookUrl,
      '🚀 Novo Projeto Criado',
      `O projeto *${p.name}* foi criado por *${p.engineer}*.`,
    )
  }

  const updateProject = (id: string, p: Partial<Project>) => {
    setProjects((prev) => {
      const oldProject = prev.find((proj) => proj.id === id)
      if (oldProject) {
        const changes: AuditLogChange[] = []
        Object.keys(p).forEach((k) => {
          const key = k as keyof Project
          if (p[key] !== oldProject[key] && p[key] !== undefined) {
            changes.push({
              field: key,
              oldValue: String(oldProject[key] || ''),
              newValue: String(p[key] || ''),
            })
          }
        })
        if (changes.length > 0) {
          addAuditLog({
            user: { name: 'Admin User' },
            action: 'Update',
            entityType: 'Project',
            entityName: oldProject.name,
            changes,
          })
        }

        if (p.status && oldProject.status !== p.status) {
          addNotification({
            title: 'Atualização de Status',
            description: `O projeto ${oldProject.name} mudou o status para ${p.status}.`,
            link: `/projects/${id}`,
          })
          sendSlackNotification(
            slackWebhookUrl,
            '🔄 Atualização de Status',
            `O projeto *${oldProject.name}* mudou de status: \n*Anterior:* ${oldProject.status} \n*Novo:* ${p.status}`,
          )
        }
      }
      return prev.map((proj) => (proj.id === id ? { ...proj, ...p } : proj))
    })
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => {
      const oldProject = prev.find((proj) => proj.id === id)
      if (oldProject) {
        addAuditLog({
          user: { name: 'Admin User' },
          action: 'Delete',
          entityType: 'Project',
          entityName: oldProject.name,
          changes: [],
        })
      }
      return prev.filter((proj) => proj.id !== id)
    })
  }

  const addComment = (c: Comment) => setComments((prev) => [...prev, c])

  const assignTask = (projectName: string, taskName: string, assigneeName: string) => {
    addNotification({
      title: 'Nova Tarefa Atribuída',
      description: `${assigneeName} foi atribuído à tarefa: ${taskName}`,
      link: '/projects',
    })
    sendSlackNotification(
      slackWebhookUrl,
      '📋 Nova Tarefa Atribuída',
      `*${assigneeName}* foi atribuído à tarefa *${taskName}* no projeto *${projectName}*.`,
    )
  }

  const markNotificationAsRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const markAllNotificationsAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const updateUserRole = (id: string, role: User['role']) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  const assignUserToProjects = (userId: string, projectIds: string[]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, assignedProjects: projectIds } : u)),
    )
  }

  const updateUserHourlyRate = (userId: string, rate: number) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, hourlyRate: rate } : u)))
  }

  const addTimeLog = (log: Omit<AppTimeLog, 'id' | 'createdAt' | 'status'>) => {
    const newLog: AppTimeLog = {
      ...log,
      id: `tl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    } as AppTimeLog
    setTimeLogs((prev) => [...prev, newLog])

    addNotification({
      title: 'Horas Pendentes',
      description: 'Um novo registro de horas aguarda aprovação.',
      link: '/history',
    })
  }

  const approveTimeLog = (id: string) => {
    setTimeLogs((prev) => {
      const log = prev.find((l) => l.id === id)
      if (!log || log.status !== 'Pending') return prev

      const user = users.find((u) => u.id === log.userId)
      const rate = user?.hourlyRate || 0
      const cost = log.hours * rate

      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === log.projectId ? { ...p, spent: (p.spent || 0) + cost } : p,
        ),
      )

      return prev.map((l) => (l.id === id ? { ...l, status: 'Approved' } : l))
    })

    addNotification({
      title: 'Horas Aprovadas',
      description: 'Um registro de horas foi aprovado e o custo foi atualizado.',
      link: '/history',
    })
  }

  const rejectTimeLog = (id: string) => {
    setTimeLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Rejected' } : l)))
    addNotification({
      title: 'Horas Rejeitadas',
      description: 'Um registro de horas foi rejeitado.',
      link: '/history',
    })
  }

  useEffect(() => {
    if (hasCheckedAutomations.current) return
    hasCheckedAutomations.current = true

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    let updatedProjects = false
    const projectsToUpdate: { id: string; changes: Partial<Project> }[] = []

    projects.forEach((p) => {
      if (p.status === 'Concluído') return

      const endDate = new Date(p.endDate)
      endDate.setHours(0, 0, 0, 0)

      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays >= 0 && diffDays <= 3) {
        addNotification({
          title: 'Prazo Crítico',
          description: `Atenção: O projeto ${p.name} vence em ${diffDays} dia(s) (${format(new Date(p.endDate), 'dd/MM/yyyy')}).`,
          link: `/projects/${p.id}`,
        })
        const localUrl = localStorage.getItem('slackWebhookUrl') || ''
        sendSlackNotification(
          localUrl,
          '⚠️ Alerta de Prazo Crítico',
          `O projeto *${p.name}* tem uma entrega se aproximando em ${diffDays} dia(s) (Data de Entrega: ${p.endDate}).`,
        )
      } else if (diffDays < 0) {
        if (p.status !== 'Atrasado') {
          projectsToUpdate.push({ id: p.id, changes: { status: 'Atrasado' } })
          updatedProjects = true
        }
        addNotification({
          title: 'Projeto Atrasado',
          description: `Alerta: O projeto ${p.name} está atrasado em ${Math.abs(diffDays)} dia(s).`,
          link: `/projects/${p.id}`,
        })
      }
    })

    if (updatedProjects) {
      setProjects((prev) =>
        prev.map((p) => {
          const update = projectsToUpdate.find((u) => u.id === p.id)
          return update ? { ...p, ...update.changes } : p
        }),
      )
    }

    const taskTimer = setTimeout(() => {
      addNotification({
        title: 'Nova Tarefa Atribuída',
        description: 'Nova tarefa atribuída: Revisão de Estrutura de Concreto',
        link: '/projects/1',
      })
      const localUrl = localStorage.getItem('slackWebhookUrl') || ''
      sendSlackNotification(
        localUrl,
        '📋 Nova Tarefa Atribuída',
        `*Eng. Ricardo Silva* foi atribuído à tarefa *Revisão de Estrutura de Concreto* no projeto *Edifício Aurora*.`,
      )
    }, 3000)

    return () => clearTimeout(taskTimer)
  }, [projects, addNotification])

  return React.createElement(
    ProjectContext.Provider,
    {
      value: {
        projects,
        addProject,
        updateProject,
        deleteProject,
        comments,
        addComment,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        users,
        updateUserRole,
        assignUserToProjects,
        updateUserHourlyRate,
        tasks,
        timeLogs,
        addTimeLog,
        approveTimeLog,
        rejectTimeLog,
        isNewProjectModalOpen,
        setNewProjectModalOpen,
        globalSearch,
        setGlobalSearch,
        slackWebhookUrl,
        setSlackWebhookUrl,
        assignTask,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        categories,
        addCategory,
        deleteCategory,
        auditLogs,
        addAuditLog,
      },
    },
    children,
  )
}

export default function useProjectStore() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectStore must be used within a ProjectProvider')
  }
  return context
}
