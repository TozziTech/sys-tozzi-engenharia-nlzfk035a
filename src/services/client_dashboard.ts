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

export const createComment = async (projectId: string, mensagem: string, autorId: string) => {
  return pb.collection('comentarios_projeto').create({
    projeto_id: projectId,
    autor: autorId,
    mensagem,
  })
}
