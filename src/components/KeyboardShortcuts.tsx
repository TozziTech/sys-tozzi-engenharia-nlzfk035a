import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { usePreferencesStore } from '@/stores/usePreferencesStore'

export function KeyboardShortcuts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { shortcuts, loadPreferences } = usePreferencesStore()

  useEffect(() => {
    if (user) {
      loadPreferences(user)
    }
  }, [user, loadPreferences])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (document.activeElement as HTMLElement)?.tagName || '',
      )

      let actionToTrigger: any = null

      for (const key in shortcuts) {
        const config = shortcuts[key]
        if (!config.key) continue

        const matchKey = e.key.toLowerCase() === config.key.toLowerCase()
        const matchAlt = e.altKey === config.altKey
        const matchCtrl = e.ctrlKey === config.ctrlKey
        const matchShift = e.shiftKey === config.shiftKey
        const matchMeta = e.metaKey === config.metaKey

        if (matchKey && matchAlt && matchCtrl && matchShift && matchMeta) {
          const hasModifiers = config.altKey || config.ctrlKey || config.metaKey || config.shiftKey
          if (isInputFocused && !hasModifiers) {
            continue // Skip single key shortcuts when typing inside an input
          }
          actionToTrigger = config
          break
        }
      }

      if (actionToTrigger) {
        e.preventDefault()
        navigate(actionToTrigger.path)
        toast.info(`Navegando para ${actionToTrigger.label}`, { duration: 1500 })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, shortcuts])

  return null
}
