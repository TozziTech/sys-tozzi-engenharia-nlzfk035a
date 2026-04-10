import { subDays } from 'date-fns'

export interface Change {
  field: string
  oldValue?: string
  newValue?: string
}

export interface Log {
  id: string
  timestamp: string
  user: {
    name: string
    avatar: string
  }
  action: string
  entityType: string
  entityName: string
  changes: Change[]
}

export const MOCK_LOGS: Log[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: {
      name: 'Eduardo Costa',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
    },
    action: 'Update',
    entityType: 'Projeto',
    entityName: 'Residencial Aurora',
    changes: [{ field: 'Status', oldValue: 'Em Andamento', newValue: 'Concluído' }],
  },
  {
    id: '2',
    timestamp: subDays(new Date(), 1).toISOString(),
    user: {
      name: 'Ana Silva',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
    },
    action: 'Assign',
    entityType: 'Equipe',
    entityName: 'Edifício Comercial Centro',
    changes: [{ field: 'Engenheiro', oldValue: 'Nenhum', newValue: 'Carlos Mendes' }],
  },
  {
    id: '3',
    timestamp: subDays(new Date(), 2).toISOString(),
    user: {
      name: 'Marcos Paulo',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
    },
    action: 'Create',
    entityType: 'Projeto',
    entityName: 'Ponte Rio Verde',
    changes: [{ field: 'Registro', newValue: 'Criado com sucesso' }],
  },
  {
    id: '4',
    timestamp: subDays(new Date(), 3).toISOString(),
    user: {
      name: 'Eduardo Costa',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
    },
    action: 'Update',
    entityType: 'Tarefa',
    entityName: 'Fundações - Torre A',
    changes: [{ field: 'Data de Fim', oldValue: '15/05/2026', newValue: '22/05/2026' }],
  },
  {
    id: '5',
    timestamp: subDays(new Date(), 5).toISOString(),
    user: {
      name: 'Julia Martins',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=4',
    },
    action: 'Delete',
    entityType: 'Tarefa',
    entityName: 'Revisão Elétrica Antiga',
    changes: [
      { field: 'Tarefa', oldValue: 'Revisão Elétrica Antiga', newValue: 'Removida do sistema' },
    ],
  },
  {
    id: '6',
    timestamp: subDays(new Date(), 8).toISOString(),
    user: {
      name: 'Eduardo Costa',
      avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
    },
    action: 'Update',
    entityType: 'Projeto',
    entityName: 'Hospital São João',
    changes: [
      { field: 'Orçamento', oldValue: 'R$ 1.500.000', newValue: 'R$ 1.750.000' },
      { field: 'Fase', oldValue: 'Planejamento', newValue: 'Execução' },
    ],
  },
]
