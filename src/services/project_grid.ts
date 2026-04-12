import pb from '@/lib/pocketbase/client'

export const getProjectColumns = async (projectId: string) => {
  return pb.collection('colunas_projeto').getFullList({
    filter: `projeto_id = "${projectId}"`,
    sort: 'created',
  })
}

export const createProjectColumn = async (data: {
  projeto_id: string
  nome: string
  tipo_dado: string
}) => {
  return pb.collection('colunas_projeto').create(data)
}

export const getHierarchicalTasks = async (projectId: string) => {
  return pb.collection('tarefas_hierarquicas').getFullList({
    filter: `projeto_id = "${projectId}"`,
    sort: 'ordem,created',
  })
}

export const createHierarchicalTask = async (data: {
  projeto_id: string
  titulo: string
  parent_id?: string | null
  concluida?: boolean
  ordem?: number
  dados_customizados?: Record<string, any>
}) => {
  const payload = { ...data }
  if (payload.parent_id === null || payload.parent_id === undefined) {
    payload.parent_id = ''
  }
  return pb.collection('tarefas_hierarquicas').create(payload)
}

export const updateHierarchicalTask = async (id: string, data: any) => {
  const payload = { ...data }
  if (payload.parent_id === null || payload.parent_id === undefined) {
    if ('parent_id' in payload) {
      payload.parent_id = ''
    }
  }
  return pb.collection('tarefas_hierarquicas').update(id, payload)
}

export const deleteHierarchicalTask = async (id: string) => {
  return pb.collection('tarefas_hierarquicas').delete(id)
}
