import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Project } from '@/types/project'

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Edifício Aurora',
    client: 'Construtora Alfa',
    discipline: 'Arquitetônico',
    status: 'Em Andamento',
    startDate: '2023-10-01',
    endDate: '2024-06-15',
    progress: 65,
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
  },
]

interface ProjectStore {
  projects: Project[]
  addProject: (p: Project) => void
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

  return React.createElement(
    ProjectContext.Provider,
    {
      value: {
        projects,
        addProject,
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
