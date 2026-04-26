import { useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRealtime } from '@/hooks/use-realtime'

export function ProjectPresence({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  const loadPresence = useCallback(async () => {
    if (!projectId) return
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const records = await pb.collection('project_presence').getFullList({
        filter: `project = "${projectId}" && last_active >= "${fiveMinsAgo.replace('T', ' ')}"`,
        expand: 'user',
      })
      // remove duplicates if any, and filter out nulls
      const usersMap = new Map()
      records.forEach((r) => {
        if (r.expand?.user) usersMap.set(r.expand.user.id, r.expand.user)
      })
      setOnlineUsers(Array.from(usersMap.values()))
    } catch (err) {
      console.error('Failed to load project presence', err)
    }
  }, [projectId])

  useEffect(() => {
    loadPresence()
  }, [loadPresence])

  useRealtime('project_presence', (e) => {
    if (e.record.project === projectId) {
      loadPresence()
    }
  })

  useEffect(() => {
    if (!user || !projectId) return

    let presenceId = ''

    const updatePresence = async () => {
      try {
        const now = new Date().toISOString()
        if (presenceId) {
          await pb
            .collection('project_presence')
            .update(presenceId, { last_active: now }, { requestKey: null })
        } else {
          try {
            const existing = await pb
              .collection('project_presence')
              .getFirstListItem(`user="${user.id}" && project="${projectId}"`, { requestKey: null })
            presenceId = existing.id
            await pb
              .collection('project_presence')
              .update(presenceId, { last_active: now }, { requestKey: null })
          } catch (e) {
            const created = await pb.collection('project_presence').create(
              {
                user: user.id,
                project: projectId,
                last_active: now,
              },
              { requestKey: null },
            )
            presenceId = created.id
          }
        }
      } catch (err) {
        console.error('Failed to update presence', err)
      }
    }

    updatePresence()
    const interval = setInterval(updatePresence, 60 * 1000)

    return () => {
      clearInterval(interval)
      if (presenceId) {
        pb.collection('project_presence')
          .delete(presenceId, { requestKey: null })
          .catch(() => {})
      }
    }
  }, [user, projectId])

  if (onlineUsers.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline">Online agora</span>
      </span>
      <div className="flex -space-x-2">
        {onlineUsers.map((u) => (
          <Tooltip key={u.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 border-2 border-background shadow-sm transition-transform hover:scale-110 relative z-10 hover:z-20">
                <AvatarImage src={u.avatar ? pb.files.getUrl(u, u.avatar) : ''} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {u.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{u.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
