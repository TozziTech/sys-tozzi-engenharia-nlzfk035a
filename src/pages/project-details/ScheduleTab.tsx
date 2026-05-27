import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function ScheduleTab({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])

  const load = () => {
    pb.collection('tasks')
      .getFullList({
        filter: `project="${projectId}" && is_internal=false`,
        sort: 'due_date',
        expand: 'module',
      })
      .then(setTasks)
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [projectId])

  useRealtime('tasks', (e) => {
    if (e.record.project === projectId) load()
  })

  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarefa</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Data Limite</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell>{t.expand?.module?.name || '-'}</TableCell>
              <TableCell>
                {t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{t.status || 'Pendente'}</Badge>
              </TableCell>
              <TableCell>{t.priority || '-'}</TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                Nenhuma tarefa de cronograma encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
