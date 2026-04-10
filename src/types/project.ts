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

export interface Attachment {
  id: string
  name: string
  url: string
  size?: string
}

export interface User {
  id: string
  name: string
  avatar: string
  role?: 'Administrador' | 'Gerente de Projeto' | 'Projetista'
}

export interface Comment {
  id: string
  projectId: string
  author: User
  content: string
  timestamp: string
  attachments?: Attachment[]
}

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  link?: string
}

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
