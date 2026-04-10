export type Discipline = 'Estrutural' | 'Hidrossanitário' | 'Elétrico' | 'Arquitetônico'
export type Status = 'Planejamento' | 'Em Andamento' | 'Concluído' | 'Atrasado'

export interface Project {
  id: string
  name: string
  client: string
  discipline: Discipline
  status: Status
  startDate: string
  endDate: string
  progress: number
}
