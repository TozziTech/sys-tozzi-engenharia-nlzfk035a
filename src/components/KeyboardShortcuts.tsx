import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function KeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any specific element is focused (like an input or textarea)
      // to avoid conflicting with standard typing shortcuts, although Alt + Key is usually safe.
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (document.activeElement as HTMLElement)?.tagName,
      )

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        let matched = true
        switch (e.key.toLowerCase()) {
          case 'a':
            navigate('/apa')
            toast.info('Navegando para Análise Pós-Ação', { duration: 1500 })
            break
          case 'k':
            navigate('/checklists')
            toast.info('Navegando para Checklists', { duration: 1500 })
            break
          case 'r':
            navigate('/admin/reunioes')
            toast.info('Navegando para Reuniões', { duration: 1500 })
            break
          case 'd':
            navigate('/files/library')
            toast.info('Navegando para Gestão ARQ/DOC', { duration: 1500 })
            break
          case 'h':
            navigate('/dashboard')
            toast.info('Navegando para Dashboard', { duration: 1500 })
            break
          default:
            matched = false
        }

        if (matched) {
          e.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return null
}
