import { useEffect, useState } from 'react'
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
import { format } from 'date-fns'
import { History } from 'lucide-react'

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([])

  const loadData = async () => {
    try {
      const records = await pb
        .collection('audit_logs')
        .getFullList({ expand: 'user_id', sort: '-created' })
      setLogs(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('audit_logs', () => loadData())

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Auditoria
          </h1>
          <p className="text-muted-foreground">Registro de atividades e alterações no sistema.</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.created), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>
                  {log.expand?.user_id?.name || log.expand?.user_id?.email || 'Sistema'}
                </TableCell>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>{log.resource}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                  {JSON.stringify(log.details)}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
