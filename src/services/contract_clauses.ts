import pb from '@/lib/pocketbase/client'

export interface ContractClause {
  id: string
  name: string
  content: string
  category?: string
  tags?: string[]
  created: string
  updated: string
  expand?: {
    tags?: Array<{
      id: string
      name: string
      color: string
    }>
  }
}

export const getContractClauses = async () => {
  return await pb.collection('contract_clauses').getFullList<ContractClause>({
    sort: '-created',
    expand: 'tags',
  })
}

export const getContractClause = async (id: string) => {
  return await pb.collection('contract_clauses').getOne<ContractClause>(id)
}

export const createContractClause = async (data: Partial<ContractClause>) => {
  return await pb.collection('contract_clauses').create<ContractClause>(data)
}

export const updateContractClause = async (id: string, data: Partial<ContractClause>) => {
  return await pb.collection('contract_clauses').update<ContractClause>(id, data)
}

export const deleteContractClause = async (id: string) => {
  return await pb.collection('contract_clauses').delete(id)
}
