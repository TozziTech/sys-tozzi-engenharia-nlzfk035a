export type Discipline =
  | 'Estrutural'
  | 'Hidrossanitário'
  | 'Elétrico'
  | 'Prevenção a Incêndio'
  | 'AVAC'
  | 'Gás'
  | 'Infraestrutura'
  | 'Arquitetura'
  | 'Geotecnia'
  | 'Ambiental'
  | 'Telecomunicações'
  | 'Design de Interiores'
  | 'Luminotécnica'

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
  description?: string
  engineer: string
  budget?: number
  spent?: number
  observations?: string
}
