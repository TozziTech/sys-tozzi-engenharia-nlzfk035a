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
  return pb.collection('tarefas_hierarquicas').create(data)
}

export const updateHierarchicalTask = async (id: string, data: any) => {
  return pb.collection('tarefas_hierarquicas').update(id, data)
}

export const deleteHierarchicalTask = async (id: string) => {
  return pb.collection('tarefas_hierarquicas').delete(id)
}
