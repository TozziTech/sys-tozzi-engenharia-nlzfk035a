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
import { format, startOfDay, endOfDay } from 'date-fns'
import { History, Search, Calendar as CalendarIcon, User as UserIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [date, setDate] = useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: undefined,
  })

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

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({ sort: 'name' })
      setUsers(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    loadUsers()
  }, [])

  useRealtime('audit_logs', () => loadData())

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchUser = selectedUser === 'all' ? true : log.user_id === selectedUser

      let matchDate = true
      if (date?.from) {
        const logDate = new Date(log.created)
        const start = startOfDay(date.from)
        const end = date.to ? endOfDay(date.to) : endOfDay(date.from)
        matchDate = logDate >= start && logDate <= end
      }

      return matchSearch && matchUser && matchDate
    })
  }, [logs, searchTerm, selectedUser, date])

  const renderDetails = (details: any) => {
    if (!details || typeof details !== 'object')
      return <span className="text-muted-foreground">-</span>

    return (
      <div className="space-y-1">
        {Object.entries(details).map(([key, val]: [string, any]) => {
          if (typeof val !== 'object' || val === null) {
            return (
              <div key={key} className="text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="ml-2 text-muted-foreground">{String(val)}</span>
              </div>
            )
          }
          const oldVal = val?.old ?? 'vazio'
          const newVal = val?.new ?? 'vazio'
          return (
            <div
              key={key}
              className="text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
            >
              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize min-w-[100px]">
                {key.replace(/_/g, ' ')}:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground line-through bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">
                  {String(oldVal)}
                </span>
                <span className="text-muted-foreground">➔</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded text-xs">
                  {String(newVal)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Histórico de Movimentações
          </h1>
          <p className="text-muted-foreground">
            Acompanhe todas as alterações de datas e movimentações realizadas no sistema.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por recurso ou ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="md:col-span-4 flex items-center">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por Usuário" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date?.from && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'dd/MM/yyyy')} - {format(date.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(date.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Filtrar por Período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={{ from: date?.from, to: date?.to }}
                  onSelect={(d: any) => setDate(d || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {(date?.from || selectedUser !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedUser('all')
                  setDate({ from: undefined })
                }}
                title="Limpar Filtros"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Data/Hora</TableHead>
              <TableHead className="w-[200px]">Usuário</TableHead>
              <TableHead className="w-[150px]">Ação</TableHead>
              <TableHead className="w-[200px]">Recurso</TableHead>
              <TableHead>Detalhes da Alteração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-slate-600 dark:text-slate-300">
                  {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                      <AvatarImage
                        src={
                          log.expand?.user_id?.avatar
                            ? pb.files.getUrl(log.expand.user_id, log.expand.user_id.avatar, {
                                thumb: '100x100',
                              })
                            : `https://img.usecurling.com/ppl/thumbnail?seed=${log.user_id}`
                        }
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {log.expand?.user_id?.name?.charAt(0) || <UserIcon className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[140px] text-sm font-medium">
                      {log.expand?.user_id?.name || log.expand?.user_id?.email || 'Sistema'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.action.toLowerCase().includes('delete')
                        ? 'destructive'
                        : log.action.toLowerCase().includes('create')
                          ? 'default'
                          : 'secondary'
                    }
                    className="font-normal text-xs"
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell
                  className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                  title={log.resource}
                >
                  {log.resource}
                </TableCell>
                <TableCell>{renderDetails(log.details)}</TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <History className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-slate-500">
                      Nenhum histórico encontrado
                    </p>
                    <p className="text-sm">
                      Tente ajustar os filtros de busca para ver mais resultados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
