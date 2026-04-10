import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Project } from '@/types/project'

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Edifício Aurora',
    client: 'Construtora Alfa',
    discipline: 'Arquitetura',
    status: 'Em Andamento',
    startDate: '2023-10-01',
    endDate: '2024-06-15',
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
    startDate: '2023-11-10',
    endDate: '2024-02-28',
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
    startDate: '2024-01-05',
    endDate: '2024-12-01',
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
    startDate: '2023-05-20',
    endDate: '2023-12-30',
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
    startDate: '2024-02-15',
    endDate: '2024-08-20',
    progress: 30,
    engineer: 'Eng. Maria Santos',
    budget: 45000,
    spent: 15000,
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
