import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InternalTasksChecklist({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    if (!projectId) return
    try {
      const records = await pb.collection('tasks').getFullList({
        filter: `project = "${projectId}" && is_internal = true`,
        sort: 'ordem,-created',
      })
      setTasks(records)
    } catch (error) {
      console.error('Error fetching internal tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  useRealtime('tasks', (e) => {
    if (!projectId) return
    if (e.record.project === projectId || e.action === 'delete') {
      fetchTasks()
    }
  })

  const toggleTaskStatus = async (task: any) => {
    const isCompleted = task.status === 'Concluído'
    const newStatus = isCompleted ? 'Pendente' : 'Concluído'

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))

    try {
      await pb.collection('tasks').update(task.id, { status: newStatus })
    } catch (error) {
      console.error('Error updating task:', error)
      fetchTasks() // Revert on failure
    }
  }

  if (!projectId) return null

  if (loading) {
    return (
      <div className="w-full mb-8">
        <Card className="border-dashed shadow-none">
          <CardHeader className="py-6">
            <CardTitle className="text-sm font-medium flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando checklist interno...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="w-full mb-8">
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-base font-medium text-foreground/70">
              Nenhuma tarefa interna encontrada
            </p>
            <p className="text-sm mt-1 text-center max-w-sm">
              As tarefas administrativas e controles marcados como internos para este projeto
              aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedCount = tasks.filter((t) => t.status === 'Concluído').length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  return (
    <div className="w-full mb-8 flex flex-col gap-4">
      <Card className="shadow-sm border-border/60 overflow-hidden">
        <CardHeader className="py-4 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Checklist Interno</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Controle de requisitos e tarefas administrativas do projeto
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {completedCount} de {tasks.length} concluídas
              </span>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {progress === 100 && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in duration-300" />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {tasks.map((task) => {
              const isCompleted = task.status === 'Concluído'
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-muted/40 transition-colors cursor-pointer group',
                    isCompleted && 'bg-muted/20',
                  )}
                  onClick={() => toggleTaskStatus(task)}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleTaskStatus(task)}
                      className={cn(
                        'h-4 w-4 transition-all duration-200',
                        isCompleted &&
                          'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 text-white',
                      )}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p
                      className={cn(
                        'text-sm font-medium leading-none transition-all duration-200',
                        isCompleted
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground group-hover:text-primary',
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p
                        className={cn(
                          'text-[13px] line-clamp-2 transition-all duration-200 mt-1',
                          isCompleted
                            ? 'text-muted-foreground/50 line-through'
                            : 'text-muted-foreground',
                        )}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Badge
                      variant={isCompleted ? 'outline' : 'secondary'}
                      className={cn(
                        'text-[10px] px-2 py-0.5 transition-all duration-200 font-medium whitespace-nowrap',
                        isCompleted
                          ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : 'group-hover:bg-primary/10 group-hover:text-primary',
                      )}
                    >
                      {task.status || 'Pendente'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
