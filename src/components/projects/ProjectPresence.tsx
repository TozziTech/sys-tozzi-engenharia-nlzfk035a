import { useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

export function ProjectPresence({ projectId }: { projectId: string }) {
  const { user } = useAuth()

  const updatePresence = useCallback(async () => {
    if (!user?.id || !projectId) return

    try {
      const records = await pb.collection('project_presence').getFullList({
        filter: `project="${projectId}" && user="${user.id}"`,
      })

      if (records.length > 0) {
        await pb.collection('project_presence').update(records[0].id, {
          last_active: new Date().toISOString(),
        })
      } else {
        await pb.collection('project_presence').create({
          project: projectId,
          user: user.id,
          last_active: new Date().toISOString(),
        })
      }
    } catch (error: any) {
      if (error?.status === 0) {
        // Ignore aborted or cancelled requests during navigation
        return
      }
      console.error('Failed to update project presence:', error)
    }
  }, [projectId, user?.id])

  useEffect(() => {
    updatePresence()
    const interval = setInterval(updatePresence, 30000)
    return () => clearInterval(interval)
  }, [updatePresence])

  return null
}
