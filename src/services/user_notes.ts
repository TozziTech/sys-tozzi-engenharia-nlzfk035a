import pb from '@/lib/pocketbase/client'

export interface UserNote {
  id: string
  user: string
  project?: string
  content?: string
  rich_content?: string
  category?: string
  last_editor?: string
  created: string
  updated: string
  expand?: {
    user?: {
      id: string
      name: string
      email: string
      avatar: string
    }
    last_editor?: {
      id: string
      name: string
      email: string
      avatar: string
    }
  }
}

export const getProjectNotes = async (projectId: string) => {
  return pb.collection('user_notes').getFullList<UserNote>({
    filter: `project = "${projectId}"`,
    sort: '-created',
    expand: 'user,last_editor',
  })
}

export const createProjectNote = async (data: Partial<UserNote>) => {
  return pb.collection('user_notes').create<UserNote>(data)
}

export const updateProjectNote = async (id: string, data: Partial<UserNote>) => {
  return pb.collection('user_notes').update<UserNote>(id, data)
}

export const deleteProjectNote = async (id: string) => {
  return pb.collection('user_notes').delete(id)
}
