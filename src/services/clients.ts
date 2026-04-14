import pb from '@/lib/pocketbase/client'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  cnpj_cpf?: string
  address?: string
  created: string
  updated: string
}

export const getClients = async () => {
  return await pb.collection('clients').getFullList<Client>({
    sort: 'name',
  })
}
