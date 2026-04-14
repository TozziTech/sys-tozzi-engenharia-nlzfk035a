import pb from '@/lib/pocketbase/client'

export interface DocumentResource {
  id: string
  title: string
  description: string
  category: string
  url: string
  created: string
  updated: string
}

export const getDocumentResources = async (category: string) => {
  return pb.collection('document_resources').getFullList<DocumentResource>({
    filter: `category = "${category}"`,
    sort: '-created',
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
