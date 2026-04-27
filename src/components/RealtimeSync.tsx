import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export function RealtimeSync() {
  const { setModuleVisibility } = useSettingsStore()
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

  return null
}
