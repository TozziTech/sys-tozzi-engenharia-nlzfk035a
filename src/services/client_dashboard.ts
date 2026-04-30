import pb from '@/lib/pocketbase/client'

export const getClientProjects = async () => {
  return pb.collection('projetos_cliente').getFullList({ sort: '-created' })
}

export const getClientProject = async (id: string) => {
  return pb.collection('projetos_cliente').getOne(id)
}

export const getProjectPhases = async (projectId: string) => {
  return pb.collection('fases_projeto').getFullList({
    filter: `projeto_id = '${projectId}'`,
    sort: 'ordem',
  })
}

export const getProjectPayments = async (projectId: string) => {
  return pb.collection('pagamentos_projeto').getFullList({
    filter: `projeto_id = '${projectId}'`,
    sort: 'data_vencimento',
  })
}

export const getProjectDocuments = async (projectId: string) => {
  return pb.collection('documentos_projeto').getFullList({
    filter: `projeto_id = '${projectId}'`,
    sort: '-created',
  })
}

export const getProjectComments = async (projectId: string) => {
  return pb.collection('comentarios_projeto').getFullList({
    filter: `projeto_id = '${projectId}'`,
    sort: '-created',
    expand: 'autor',
  })
}

export const getClientPayments = async (clientId: string) => {
  return pb.collection('pagamentos_projeto').getFullList({
    filter: `projeto_id.cliente = '${clientId}'`,
    sort: 'data_vencimento',
  })
}

export const getClientComments = async (clientId: string) => {
  return pb.collection('comentarios_projeto').getFullList({
    filter: `projeto_id.cliente = '${clientId}'`,
    sort: '-created',
    expand: 'autor,projeto_id',
  })
}

export const getClientPhases = async (clientId: string) => {
  return pb.collection('fases_projeto').getFullList({
    filter: `projeto_id.cliente = '${clientId}'`,
  })
}

export const createComment = async (projectId: string, mensagem: string, autorId: string) => {
  return pb.collection('comentarios_projeto').create({
    projeto_id: projectId,
    autor: autorId,
    mensagem,
  })
}

export const updateClientProject = async (id: string, data: any) => {
  return pb.collection('projetos_cliente').update(id, data)
}

export const createProjectPhase = async (data: any) => {
  return pb.collection('fases_projeto').create(data)
}

export const updateProjectPhase = async (id: string, data: any) => {
  return pb.collection('fases_projeto').update(id, data)
}

export const deleteProjectPhase = async (id: string) => {
  return pb.collection('fases_projeto').delete(id)
}

export const createProjectPayment = async (data: any) => {
  return pb.collection('pagamentos_projeto').create(data)
}

export const updateProjectPayment = async (id: string, data: any) => {
  return pb.collection('pagamentos_projeto').update(id, data)
}

export const deleteProjectPayment = async (id: string) => {
  return pb.collection('pagamentos_projeto').delete(id)
}

export const deleteProjectDocument = async (id: string) => {
  return pb.collection('documentos_projeto').delete(id)
}
