export interface ProjectModule {
  id: string
  name: string
  project: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Pausado'
  progress: number
  deadline: string
  notes: string
  responsible?: string
  expand?: {
    responsible?: {
      id: string
      collectionId?: string
      collectionName?: string
      name: string
      avatar: string
    }
  }
  created: string
  updated: string
}
