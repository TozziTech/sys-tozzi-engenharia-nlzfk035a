import pb from '@/lib/pocketbase/client'

export const getProject = (id: string) =>
  pb.collection('projects').getOne(id, { expand: 'client_ref' })

export const updateProject = (id: string, data: any) => pb.collection('projects').update(id, data)
