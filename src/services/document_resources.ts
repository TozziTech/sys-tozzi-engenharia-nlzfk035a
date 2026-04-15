import pb from '@/lib/pocketbase/client'

export interface DocumentResource {
  id: string
  title: string
  description: string
  category: string
  url: string
  discipline?: string
  is_suggested_video?: boolean
  tags?: string[]
  ordem?: number
  expand?: {
    tags?: any[]
  }
  created: string
  updated: string
}

export const getDocumentResources = async (category: string) => {
  return pb.collection('document_resources').getFullList<DocumentResource>({
    filter: `category = "${category}"`,
    sort: '-created',
    expand: 'tags',
  })
}

export const createDocumentResource = async (data: Partial<DocumentResource>) => {
  return pb.collection('document_resources').create<DocumentResource>(data)
}

export const updateDocumentResource = async (id: string, data: Partial<DocumentResource>) => {
  return pb.collection('document_resources').update<DocumentResource>(id, data)
}

export const deleteDocumentResource = async (id: string) => {
  return pb.collection('document_resources').delete(id)
}

export const updateDocumentResourceOrder = async (updates: { id: string; ordem: number }[]) => {
  const promises = updates.map((update) =>
    pb.collection('document_resources').update(update.id, { ordem: update.ordem }),
  )
  return Promise.all(promises)
}
