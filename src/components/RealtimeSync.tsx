import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import useProjectStore from '@/stores/useProjectStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export function RealtimeSync() {
  const { projects, updateProject } = useProjectStore()
  const { realtimeEnabled, setModuleVisibility } = useSettingsStore()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const records = await pb.collection('company_settings').getFullList()
        if (records.length > 0) {
          setModuleVisibility(records[0].module_visibility || {})
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSettings()
  }, [setModuleVisibility])

  useRealtime('company_settings', (e) => {
    if (e.action === 'update' || e.action === 'create') {
      setModuleVisibility(e.record.module_visibility || {})
    }
  })

  useRealtime('audit_logs', async (e) => {
    if (e.action === 'create' && e.record.action === 'Task Rescheduled') {
      try {
        if (e.record.user_id === pb.authStore.record?.id) return

        const user = await pb.collection('users').getOne(e.record.user_id)
        const dateStr = e.record.details?.new_date
          ? format(new Date(e.record.details.new_date), 'dd/MM/yyyy')
          : 'Data Indefinida'

        toast({
          title: 'Tarefa Reagendada',
          description: `${user.name} moveu a tarefa '${e.record.resource}' para ${dateStr}.`,
        })
      } catch (err) {
        console.error('Failed to fetch user for notification', err)
      }
    }
  })

  useEffect(() => {
    if (!realtimeEnabled) return

    // Simulate real-time updates for demonstration
    const interval = setInterval(() => {
      if (projects.length === 0) return

      // Find projects that are not 100% complete
      const activeProjects = projects.filter((p) => p.progress < 100 && p.status !== 'Concluído')
      if (activeProjects.length === 0) return

      const randomProject = activeProjects[Math.floor(Math.random() * activeProjects.length)]
      const newProgress = Math.min(100, randomProject.progress + Math.floor(Math.random() * 15) + 5)

      updateProject(randomProject.id, {
        progress: newProgress,
        ...(newProgress === 100 ? { status: 'Concluído' } : {}),
      })

      toast({
        title: 'Sincronização em Tempo Real',
        description: `O projeto "${randomProject.name}" foi atualizado por outro membro da equipe.`,
      })
    }, 20000) // Trigger every 20 seconds for demo visibility

    return () => clearInterval(interval)
  }, [projects, updateProject, toast, realtimeEnabled])

  return null
}
