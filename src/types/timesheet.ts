export interface TimesheetEntry {
  id: string
  projectId: string
  taskId: string
  date: string
  hours: number
  description: string
  engineerId: string
}

export interface Task {
  id: string
  projectId: string
  name: string
}

export interface ProjectMetrics {
  id: string
  name: string
  plannedHours: number
  realHours: number
  estimatedCost: number
  realCost: number
}

export interface EngineerProductivity {
  id: string
  name: string
  taskHours: number
  totalHours: number
  productivity: number
}
