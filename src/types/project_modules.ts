export interface ProjectModule {
  id: string
  name: string
  project: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Pausado'
  progress: number
  deadline: string
  notes: string
  created: string
  updated: string
}
