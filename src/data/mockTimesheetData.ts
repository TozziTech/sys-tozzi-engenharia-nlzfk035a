import { Task, ProjectMetrics, EngineerProductivity } from '@/types/timesheet'

export const mockProjects = [
  { id: 'p1', name: 'Edifício Alpha' },
  { id: 'p2', name: 'Residencial Beta' },
  { id: 'p3', name: 'Ponte Gama' },
]

export const mockTasks: Task[] = [
  { id: 't1', projectId: 'p1', name: 'Fundações' },
  { id: 't2', projectId: 'p1', name: 'Estrutura de Concreto' },
  { id: 't3', projectId: 'p1', name: 'Alvenaria' },
  { id: 't4', projectId: 'p2', name: 'Instalações Elétricas' },
  { id: 't5', projectId: 'p2', name: 'Acabamentos' },
  { id: 't6', projectId: 'p3', name: 'Topografia' },
  { id: 't7', projectId: 'p3', name: 'Terraplenagem' },
]

export const mockProjectMetrics: ProjectMetrics[] = [
  {
    id: 'p1',
    name: 'Edifício Alpha',
    plannedHours: 1200,
    realHours: 1150,
    estimatedCost: 250000,
    realCost: 242000,
  },
  {
    id: 'p2',
    name: 'Residencial Beta',
    plannedHours: 850,
    realHours: 980,
    estimatedCost: 180000,
    realCost: 210000,
  },
  {
    id: 'p3',
    name: 'Ponte Gama',
    plannedHours: 600,
    realHours: 580,
    estimatedCost: 120000,
    realCost: 118500,
  },
]

export const mockProductivity: EngineerProductivity[] = [
  { id: 'e1', name: 'Eduardo Costa', taskHours: 140, totalHours: 160, productivity: 87.5 },
  { id: 'e2', name: 'Ana Silva', taskHours: 152, totalHours: 160, productivity: 95.0 },
  { id: 'e3', name: 'Carlos Santos', taskHours: 110, totalHours: 160, productivity: 68.75 },
  { id: 'e4', name: 'Mariana Lima', taskHours: 135, totalHours: 150, productivity: 90.0 },
]
