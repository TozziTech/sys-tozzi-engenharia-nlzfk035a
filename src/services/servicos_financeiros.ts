import pb from '@/lib/pocketbase/client'

export interface Parcela {
  id: string
  descricao?: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'Pendente' | 'Pago'
}

export interface ServicoFinanceiro {
  id: string
  user_id: string
  codigo: string
  projeto_servico: string
  project_ref?: string
  observacoes?: string
  cliente?: string
  data_inicio: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado'
  valor_total: number
  parcelas?: Parcela[]
  created: string
  updated: string
  expand?: any
}

export const getServicos = async (params?: {
  userId?: string
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
}) => {
  const filterParts: string[] = []

  if (params?.userId) {
    filterParts.push(`user_id = "${params.userId}"`)
  }
  if (params?.search) {
    const safeSearch = params.search.replace(/"/g, '\\"')
    filterParts.push(
      `(cliente ~ "${safeSearch}" || projeto_servico ~ "${safeSearch}" || codigo ~ "${safeSearch}")`,
    )
  }
  if (params?.status && params.status !== 'Todos') {
    filterParts.push(`status = "${params.status}"`)
  }
  if (params?.fromDate) {
    filterParts.push(`data_inicio >= "${params.fromDate}"`)
  }
  if (params?.toDate) {
    filterParts.push(`data_inicio <= "${params.toDate}"`)
  }

  const filter = filterParts.join(' && ')

  return await pb.collection('servicos_financeiros').getFullList<ServicoFinanceiro>({
    sort: '-created',
    filter: filter || undefined,
    expand: 'user_id,project_ref',
  })
}

export const createServico = async (data: Partial<ServicoFinanceiro>) => {
  return await pb.collection('servicos_financeiros').create<ServicoFinanceiro>(data)
}

export const updateServico = async (id: string, data: Partial<ServicoFinanceiro>) => {
  return await pb.collection('servicos_financeiros').update<ServicoFinanceiro>(id, data)
}

export const deleteServico = async (id: string) => {
  return await pb.collection('servicos_financeiros').delete(id)
}

export const getNextServicoCode = async () => {
  const records = await pb.collection('servicos_financeiros').getList<ServicoFinanceiro>(1, 1, {
    filter: 'codigo ~ "SER-"',
    sort: '-codigo',
  })

  if (records.items.length === 0) return 'SER-001'

  const lastCode = records.items[0].codigo
  const match = lastCode.match(/SER-(\d+)/)
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1
    return `SER-${nextNum.toString().padStart(3, '0')}`
  }
  return 'SER-001'
}

export const checkServicoCodeExists = async (code: string, excludeId?: string) => {
  let filter = `codigo = "${code}"`
  if (excludeId) filter += ` && id != "${excludeId}"`

  const records = await pb.collection('servicos_financeiros').getList(1, 1, {
    filter,
  })
  return records.items.length > 0
}
