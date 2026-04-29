import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'

export function ThemeSync() {
  const { setTheme } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.ui_preferences?.theme) {
      setTheme(user.ui_preferences.theme)
    }
  }, [user?.ui_preferences?.theme, setTheme])

  return null
}
