import { useEffect, useState, useMemo } from 'react'
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
import { History, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')

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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.expand?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchAction = filterAction ? log.action === filterAction : true
      return matchSearch && matchAction
    })
  }, [logs, searchTerm, filterAction])

  const renderDetails = (details: any) => {
    if (!details || typeof details !== 'object')
      return <span className="text-muted-foreground">-</span>

    return (
      <div className="space-y-1">
        {Object.entries(details).map(([key, val]: [string, any]) => (
          <div key={key} className="text-sm">
            <span className="font-medium capitalize">{key}:</span>{' '}
            <span className="text-muted-foreground line-through mr-1">{val.old || 'vazio'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ➔ {val.new || 'vazio'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const actions = Array.from(new Set(logs.map((l) => l.action)))

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Auditoria
          </h1>
          <p className="text-muted-foreground">
            Registro detalhado de alterações e atividades no sistema.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por recurso ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-64">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">Todas as ações</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead className="w-[400px]">Detalhes da Alteração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {log.expand?.user_id?.name || log.expand?.user_id?.email || 'Sistema'}
                </TableCell>
                <TableCell>
                  <Badge variant={log.action === 'Update' ? 'default' : 'secondary'}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{log.resource}</TableCell>
                <TableCell>{renderDetails(log.details)}</TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhum registro de auditoria encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
