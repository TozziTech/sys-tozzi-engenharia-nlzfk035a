export interface ProjectModule {
  id: string
  name: string
  project: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Pausado'
  progress: number
  deadline: string
  notes: string
  documents?: string[]
  responsible?: string
  designer?: string
  expand?: {
    responsible?: {
      id: string
      collectionId?: string
      collectionName?: string
      name: string
      avatar: string
    }
    designer?: {
      id: string
      collectionId?: string
      collectionName?: string
      name: string
      avatar: string
    }
    project?: {
      id: string
      name: string
      status: string
      end_date: string
      progress: number
      client: string
    }
  }
  created: string
  updated: string
}
