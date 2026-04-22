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
  hourlyRate?: number
  assignedProjects?: string[]
  specialty?: string
  crea?: string
  address?: string
  phone?: string
  email?: string
  cpf?: string
  rg?: string
  birthDate?: string
  altPhone?: string
  bankData?: {
    bank: string
    agency: string
    account: string
    pix: string
  }
}

export interface TimeLog {
  id: string
  projectId: string
  taskId: string
  userId: string
  date: string
  hours: number
  description: string
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  name: string
  responsible?: string
}

export interface Comment {
  id: string
  projectId: string
  author: User
  content: string
  timestamp: string
  attachments?: Attachment[]
}

export interface AuditLogChange {
  field: string
  oldValue?: string
  newValue: string
}

export interface AuditLog {
  id: string
  timestamp: string
  user: { name: string; id?: string }
  action: 'Create' | 'Update' | 'Delete' | 'Assign' | string
  entityType: string
  entityName: string
  changes: AuditLogChange[]
}

export interface AppNotification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  link?: string
  is_important?: boolean
  action_type?: string
  action_payload?: string
}

export interface ExpenseCategory {
  id: string
  name: string
  color: string
}

export interface Transaction {
  id: string
  projectId: string
  description: string
  type: 'Entrada' | 'Saída'
  value: number
  date: string
  categoryId?: string
  status?: 'Pendente' | 'Pago'
}

export interface Project {
  id: string
  name: string
  client: string
  discipline?: Discipline
  status: Status
  startDate: string
  endDate: string
  progress: number
  description?: string
  engineer: string
  budget?: number
  spent?: number
  estimatedHours?: number
  observations?: string
  cno?: string
  cnpj?: string
  cnpj_obra?: string
  is_priority?: boolean
  deletedAt?: string
}
