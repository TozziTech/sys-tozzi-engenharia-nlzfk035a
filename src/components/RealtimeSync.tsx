import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'

export function RealtimeSync() {
  const { setModuleVisibility } = useSettingsStore()
  const { toast } = useToast()
  const { user } = useAuth()

  // Ensure subscriptions only run when the user is fully authenticated
  const enabled = !!user && pb.authStore.isValid

  useEffect(() => {
    const fetchSettings = async () => {
      if (!enabled) return
      try {
        const records = await pb.collection('company_settings').getFullList()
        if (records.length > 0) {
          setModuleVisibility(records[0].module_visibility || {})
        }
      } catch (err) {
        console.error('Failed to fetch settings', err)
      }
    }
    fetchSettings()
  }, [setModuleVisibility, enabled])

  useRealtime(
    'company_settings',
    (e) => {
      if (e.action === 'update' || e.action === 'create') {
        setModuleVisibility(e.record.module_visibility || {})
      }
    },
    enabled,
  )

  useRealtime(
    'audit_logs',
    async (e) => {
      if (e.action === 'create' && e.record.action === 'Task Rescheduled') {
        try {
          if (e.record.user_id === pb.authStore.record?.id) return

          const userLog = await pb.collection('users').getOne(e.record.user_id)
          const dateStr = e.record.details?.new_date
            ? format(new Date(e.record.details.new_date), 'dd/MM/yyyy')
            : 'Data Indefinida'

          toast({
            title: 'Tarefa Reagendada',
            description: `${userLog.name} moveu a tarefa '${e.record.resource}' para ${dateStr}.`,
          })
        } catch (err) {
          console.error('Failed to fetch user for notification', err)
        }
      }
    },
    enabled,
  )

  return null
}
