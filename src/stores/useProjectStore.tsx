import React, { createContext, useContext, useState, ReactNode } from 'react'
import { addDays, subDays, format } from 'date-fns'
import { Project } from '@/types/project'

const today = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

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
    endDate: fmt(addDays(today, 180)),
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
    endDate: fmt(subDays(today, 30)),
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
    endDate: fmt(addDays(today, 90)),
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
  isNewProjectModalOpen: boolean
  setNewProjectModalOpen: (open: boolean) => void
  globalSearch: string
  setGlobalSearch: (s: string) => void
}

const ProjectContext = createContext<ProjectStore | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [isNewProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const addProject = (p: Project) => setProjects((prev) => [p, ...prev])
  const updateProject = (id: string, p: Partial<Project>) =>
    setProjects((prev) => prev.map((proj) => (proj.id === id ? { ...proj, ...p } : proj)))
  const deleteProject = (id: string) => setProjects((prev) => prev.filter((proj) => proj.id !== id))

  return React.createElement(
    ProjectContext.Provider,
    {
      value: {
        projects,
        addProject,
        updateProject,
        deleteProject,
        isNewProjectModalOpen,
        setNewProjectModalOpen,
        globalSearch,
        setGlobalSearch,
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
