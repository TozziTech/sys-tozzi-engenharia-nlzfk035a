import pb from '@/lib/pocketbase/client'

export interface Contact {
  id: string
  code: string
  name: string
  company: string
  phone: string
  alt_phone?: string
  email: string
  address?: string
  notes?: string
  category: string
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
