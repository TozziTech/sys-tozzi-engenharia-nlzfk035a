export const SUB_DISCIPLINES_LIST = [
  'Alvenaria Estrutural',
  'Protendido',
  'Concreto Armado',
  'Esgoto',
  'Água Fria',
  'Água Quente',
]

export const SUB_DISCIPLINES_COLORS: Record<string, string> = {
  'Alvenaria Estrutural':
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Protendido:
    'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  'Concreto Armado':
    'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  Esgoto:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  'Água Fria':
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Água Quente':
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
}

export interface ProjectModule {
  id: string
  name: string
  project: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Pausado' | 'Em Análise' | 'Em Revisão'
  progress: number
  deadline: string
  deadline_days?: number
  start_date?: string
  edificacao?: string
  notes: string
  documents?: string[]
  responsible?: string
  designer?: string
  sub_disciplines?: any[]
  ordem?: number
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
