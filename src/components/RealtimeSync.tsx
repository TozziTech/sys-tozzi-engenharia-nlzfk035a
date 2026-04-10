import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import useProjectStore from '@/stores/useProjectStore'

export function RealtimeSync() {
  const { projects, updateProject } = useProjectStore()
  const { toast } = useToast()

  useEffect(() => {
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
  }, [projects, updateProject, toast])

  return null
}
