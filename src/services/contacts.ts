import pb from '@/lib/pocketbase/client'

export interface Contact {
  id: string
  name: string
  company: string
  phone: string
  email: string
  category: 'Cliente' | 'Fornecedor' | 'Parceiro'
  is_favorite?: boolean
  created: string
  updated: string
}

export const getContacts = () =>
  pb.collection('contacts').getFullList<Contact>({ sort: '-created' })
export const createContact = (data: Partial<Contact>) =>
  pb.collection('contacts').create<Contact>(data)
export const updateContact = (id: string, data: Partial<Contact>) =>
  pb.collection('contacts').update<Contact>(id, data)
export const deleteContact = (id: string) => pb.collection('contacts').delete(id)
