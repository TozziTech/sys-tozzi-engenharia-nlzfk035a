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
import { Project, User, Comment, AppNotification } from '@/types/project'
import { sendSlackNotification } from '@/lib/slack'

const today = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'João Carlos',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
  },
  {
    id: '2',
    name: 'Ana Silva',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
  },
  {
    id: '3',
    name: 'Marcos Paulo',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
  },
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
    startDate: fmt(addDays(today, 5)),
    endDate: fmt(addDays(today, 1)), // Vence em 1 dia
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
    endDate: fmt(subDays(today, 30)), // Atrasado
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
    endDate: fmt(subDays(today, 2)), // Ultrapassou o prazo
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

  isNewProjectModalOpen: boolean
  setNewProjectModalOpen: (open: boolean) => void
  globalSearch: string
  setGlobalSearch: (s: string) => void

  slackWebhookUrl: string
  setSlackWebhookUrl: (url: string) => void
  assignTask: (projectName: string, taskName: string, assigneeName: string) => void
}

const ProjectContext = createContext<ProjectStore | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS)
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [slackWebhookUrl, setSlackWebhookUrlState] = useState(
    () => localStorage.getItem('slackWebhookUrl') || '',
  )
  const hasCheckedAutomations = useRef(false)

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

    // Edge Function Mock - Email Integration
    console.log(
      `[Edge Function Mock] Envio de email disparado via Resend para a notificação: "${newNotif.title}"`,
    )
  }, [])

  const addProject = (p: Project) => {
    setProjects((prev) => [p, ...prev])
    sendSlackNotification(
      slackWebhookUrl,
      '🚀 Novo Projeto Criado',
      `O projeto *${p.name}* foi criado por *${p.engineer}*.`,
    )
  }

  const updateProject = (id: string, p: Partial<Project>) => {
    setProjects((prev) => {
      const oldProject = prev.find((proj) => proj.id === id)
      if (oldProject && p.status && oldProject.status !== p.status) {
        // Status Change Trigger
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
      return prev.map((proj) => (proj.id === id ? { ...proj, ...p } : proj))
    })
  }

  const deleteProject = (id: string) => setProjects((prev) => prev.filter((proj) => proj.id !== id))

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

  // Automated Event Triggers
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

      // Upcoming Deadline
      if (diffDays === 1 || diffDays === 2) {
        addNotification({
          title: 'Prazo Próximo',
          description: `Prazo próximo: O projeto ${p.name} vence em ${diffDays} dia(s).`,
          link: `/projects/${p.id}`,
        })
        const localUrl = localStorage.getItem('slackWebhookUrl') || ''
        sendSlackNotification(
          localUrl,
          '⚠️ Alerta de Prazo Próximo',
          `O projeto *${p.name}* tem uma entrega se aproximando em ${diffDays} dia(s) (Data de Entrega: ${p.endDate}).`,
        )
      }
      // Delayed Projects
      else if (diffDays < 0 && p.status !== 'Atrasado') {
        addNotification({
          title: 'Projeto Atrasado',
          description: `Projeto atrasado: ${p.name} ultrapassou o prazo.`,
          link: `/projects/${p.id}`,
        })
        projectsToUpdate.push({ id: p.id, changes: { status: 'Atrasado' } })
        updatedProjects = true
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

    // Mock new task assignment after 3 seconds
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
        users: MOCK_USERS,
        isNewProjectModalOpen,
        setNewProjectModalOpen,
        globalSearch,
        setGlobalSearch,
        slackWebhookUrl,
        setSlackWebhookUrl,
        assignTask,
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
