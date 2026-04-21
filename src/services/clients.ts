import pb from '@/lib/pocketbase/client'

export interface Client {
  id: string
  code?: string
  status?: string
  notes?: string
  documents?: string[]
  name: string
  email?: string
  phone?: string
  cnpj_cpf?: string
  address?: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
  alt_phone?: string
  contact_name?: string
  instagram?: string
  facebook?: string
  website?: string
  created: string
  updated: string
}

export const getClients = async () => {
  return await pb.collection('clients').getFullList<Client>({
    sort: 'name',
  })
}
