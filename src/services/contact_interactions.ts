import pb from '@/lib/pocketbase/client'

export interface ContactInteraction {
  id: string
  contact: string
  user: string
  content: string
  interaction_date?: string
  created: string
  updated: string
  expand?: {
    user?: {
      name: string
      avatar?: string
      email: string
    }
  }
}

export const getContactInteractions = (contactId: string) =>
  pb.collection('contact_interactions').getFullList<ContactInteraction>({
    filter: `contact = "${contactId}"`,
    sort: '-interaction_date,-created',
    expand: 'user',
  })

export const createContactInteraction = (data: Partial<ContactInteraction>) =>
  pb.collection('contact_interactions').create<ContactInteraction>(data)

export const deleteContactInteraction = (id: string) =>
  pb.collection('contact_interactions').delete(id)
