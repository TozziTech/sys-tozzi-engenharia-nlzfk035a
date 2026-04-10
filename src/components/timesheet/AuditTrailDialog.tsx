import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { History as HistoryIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

const getLocalAuditLogs = (logId: string) => {
  const all = JSON.parse(localStorage.getItem('mock_audit_logs') || '[]')
  const entryLogs = all.filter((a: any) => a.time_entry_id === logId)

  // Fallback "Created" record to ensure Audit Trail displays something if offline
  if (entryLogs.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        action: 'Created',
        performed_by: 'Sistema',
        timestamp: new Date().toISOString(),
      },
    ]
  }
  return entryLogs
}

export function AuditTrailDialog({ logId }: { logId: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadLogs()
    }
  }, [open, logId])

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('time_entry_id', logId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setLogs(data && data.length > 0 ? data : getLocalAuditLogs(logId))
    } catch (err) {
      setLogs(
        getLocalAuditLogs(logId).sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 w-full sm:w-auto">
          <HistoryIcon className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Ver</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Trilha de Auditoria</DialogTitle>
          <DialogDescription>
            Histórico de aprovações e alterações deste registro.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead>Realizado por</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          log.action === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : log.action === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {log.action === 'Approved'
                          ? 'Aprovado'
                          : log.action === 'Rejected'
                            ? 'Rejeitado'
                            : 'Criado'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{log.performed_by}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
