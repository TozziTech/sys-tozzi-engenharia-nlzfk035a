import pb from '@/lib/pocketbase/client'

export interface ServicoFinanceiro {
  id: string
  user_id: string
  codigo: string
  projeto_servico: string
  observacoes?: string
  cliente?: string
  data_inicio: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado'
  valor_total: number
  created: string
  updated: string
  expand?: any
}

export const getServicos = async () => {
  return await pb.collection('servicos_financeiros').getFullList<ServicoFinanceiro>({
    sort: '-created',
    expand: 'user_id',
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
