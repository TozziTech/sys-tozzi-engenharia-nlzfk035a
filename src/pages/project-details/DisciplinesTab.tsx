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

export function DisciplinesTab({ projectId }: { projectId: string }) {
  const [modules, setModules] = useState<any[]>([])

  const load = () => {
    pb.collection('project_modules')
      .getFullList({ filter: `project="${projectId}"`, expand: 'responsible' })
      .then(setModules)
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [projectId])

  useRealtime('project_modules', (e) => {
    if (e.record.project === projectId) load()
  })

  return (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Disciplina</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Prazo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell>{m.expand?.responsible?.name || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline">{m.status}</Badge>
              </TableCell>
              <TableCell>{m.progress || 0}%</TableCell>
              <TableCell>
                {m.deadline ? new Date(m.deadline).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
            </TableRow>
          ))}
          {modules.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                Nenhuma disciplina cadastrada para este projeto.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
