import pb from '@/lib/pocketbase/client'
import { DocumentResource } from './document_resources'

export interface UserDocumentFavorite {
  id: string
  user_id: string
  document_id: string
  created: string
  updated: string
  expand?: {
    document_id: DocumentResource
  }
}

export const getMyFavorites = async () => {
  return pb.collection('user_document_favorites').getFullList<UserDocumentFavorite>({
    expand: 'document_id',
    sort: '-created',
  })
}

export const toggleFavorite = async (
  userId: string,
  documentId: string,
  currentFavoriteId?: string,
) => {
  if (currentFavoriteId) {
    await pb.collection('user_document_favorites').delete(currentFavoriteId)
    return null
  } else {
    return pb.collection('user_document_favorites').create<UserDocumentFavorite>({
      user_id: userId,
      document_id: documentId,
    })
  }
}
