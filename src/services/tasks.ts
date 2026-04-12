import pb from '@/lib/pocketbase/client'

export const getModuleTasks = async (moduleId: string) => {
  try {
    return await pb.collection('tasks').getFullList({
      filter: `module = "${moduleId}"`,
      expand: 'responsible',
      sort: 'created',
    })
  } catch (err) {
    console.error('Error fetching module tasks', err)
    return []
  }
}
