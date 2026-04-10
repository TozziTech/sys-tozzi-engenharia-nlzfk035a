import { useState, useMemo } from 'react'
import { format, subDays, isAfter } from 'date-fns'
import {
  ArrowRight,
  Search,
  History as HistoryIcon,
  FileText,
  FileSpreadsheet,
  Clock,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useProjectStore from '@/stores/useProjectStore'
import { useToast } from '@/hooks/use-toast'
import { AuditTrailDialog } from '@/components/timesheet/AuditTrailDialog'
import { MOCK_LOGS } from '@/lib/mock-logs'
import { exportExcel } from '@/lib/export'
import { PrintReport } from '@/components/PrintReport'
import { TimeEntryForm } from '@/components/timesheet/TimeEntryForm'

function ActionBadge({ action }: { action: string }) {
  const variants: Record<string, { label: string; classes: string }> = {
    Create: {
      label: 'Criação',
      classes:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    },
    Update: {
      label: 'Edição',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    },
    Delete: {
      label: 'Exclusão',
      classes:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    },
    Assign: {
      label: 'Atribuição',
      classes:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    },
  }
  const config = variants[action] || { label: action, classes: '' }
  return (
    <Badge variant="outline" className={config.classes}>
      {config.label}
    </Badge>
  )
}

export default function History() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const [period, setPeriod] = useState('all')
  const [activeTab, setActiveTab] = useState('system')

  const { projects, users, timeLogs, tasks, approveTimeLog, rejectTimeLog } = useProjectStore()
  const { toast } = useToast()

  const [currentUserId, setCurrentUserId] = useState(users[0]?.id)
  const currentUserObj = users.find((u) => u.id === currentUserId) || users[0]
  const currentUser = currentUserObj?.name || 'Admin User'

  const isManager = ['Gerente de Projeto', 'Administrador'].includes(currentUserObj?.role || '')

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const matchesSearch =
        log.user.name.toLowerCase().includes(search.toLowerCase()) ||
        log.entityName.toLowerCase().includes(search.toLowerCase())
      const matchesAction = action === 'all' || log.action === action
      let matchesDate = true
      if (period === '7d') matchesDate = isAfter(new Date(log.timestamp), subDays(new Date(), 7))
      if (period === '30d') matchesDate = isAfter(new Date(log.timestamp), subDays(new Date(), 30))

      return matchesSearch && matchesAction && matchesDate
    })
  }, [search, action, period])

  const handleExportPDF = () => {
    const originalTitle = document.title
    document.title = `System_Report_${format(new Date(), 'yyyy-MM-dd')}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 100)
  }

  const handleExportExcel = () => {
    exportExcel(filteredLogs, projects.length)
  }

  const handleStatusChange = async (log: any, newStatus: 'Approved' | 'Rejected') => {
    if (newStatus === 'Approved') {
      approveTimeLog(log.id)
    } else {
      rejectTimeLog(log.id)
    }

    const auditEntry = {
      id: crypto.randomUUID(),
      time_entry_id: log.id,
      action: newStatus,
      performed_by: currentUser,
      timestamp: new Date().toISOString(),
    }

    try {
      const { supabase } = await import('@/lib/supabase')

      await supabase.from('time_entries').update({ status: newStatus }).eq('id', log.id)

      await supabase.from('audit_logs').insert(auditEntry)

      toast({
        title: 'Sucesso',
        description: `Status atualizado para ${newStatus === 'Approved' ? 'Aprovado' : 'Rejeitado'} e salvo no banco de dados.`,
      })
    } catch (err) {
      const all = JSON.parse(localStorage.getItem('mock_audit_logs') || '[]')
      localStorage.setItem('mock_audit_logs', JSON.stringify([auditEntry, ...all]))

      toast({
        title: 'Status Atualizado (Offline)',
        description: `O banco de dados não está conectado. Status salvo localmente.`,
      })
    }

    const project = projects.find((p) => p.id === log.projectId)
    const task = tasks.find((t) => t.id === log.taskId)

    const notificationEvent = new CustomEvent('add-notification', {
      detail: {
        id: crypto.randomUUID(),
        title: newStatus === 'Approved' ? 'Horas Aprovadas' : 'Horas Rejeitadas',
        description: `Suas horas (${log.hours}h) no projeto "${project?.name || 'Desconhecido'}" - tarefa "${task?.name || 'N/A'}" foram ${newStatus === 'Approved' ? 'aprovadas' : 'rejeitadas'} por ${currentUser}.`,
        read: false,
        timestamp: new Date().toISOString(),
        link: '/history',
      },
    })
    window.dispatchEvent(notificationEvent)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative">
      <PrintReport logs={filteredLogs} userName={currentUser} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Histórico e Time Tracking</h2>
          <p className="text-muted-foreground">
            Acompanhe atividades do sistema e registro de horas (Timesheet).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end items-center">
          <div className="flex items-center gap-2 mr-2 border-r border-border pr-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">Visão:</span>
            <Select value={currentUserId} onValueChange={setCurrentUserId}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Clock className="h-4 w-4 mr-2" />
                Registrar Horas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <TimeEntryForm />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportPDF} className="flex-1 sm:flex-none">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="flex-1 sm:flex-none">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
        <TabsList className="mb-4">
          <TabsTrigger value="system">Logs do Sistema</TabsTrigger>
          <TabsTrigger value="time">Histórico de Horas</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5" />
                    Trilha de Auditoria
                  </CardTitle>
                  <CardDescription>
                    Visualização cronológica de alterações em projetos e tarefas.
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por usuário ou projeto..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Ações</SelectItem>
                      <SelectItem value="Create">Criação</SelectItem>
                      <SelectItem value="Update">Edição</SelectItem>
                      <SelectItem value="Delete">Exclusão</SelectItem>
                      <SelectItem value="Assign">Atribuição</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo período</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data & Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação / Entidade</TableHead>
                      <TableHead>Detalhes da Alteração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum registro encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={log.user.avatar} />
                                <AvatarFallback>{log.user.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{log.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <ActionBadge action={log.action} />
                              <span className="text-sm font-medium">{log.entityName}</span>
                              <span className="text-xs text-muted-foreground">
                                {log.entityType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {log.changes.map((change, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="font-medium text-slate-700 dark:text-slate-300 min-w-[80px]">
                                    {change.field}:
                                  </span>
                                  {change.oldValue && (
                                    <>
                                      <span className="line-through text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded text-xs">
                                        {change.oldValue}
                                      </span>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    </>
                                  )}
                                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded text-xs">
                                    {change.newValue}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Horas Registradas
              </CardTitle>
              <CardDescription>
                Visualização cronológica das horas apontadas nos projetos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-center w-[120px]">Auditoria</TableHead>
                      {isManager && <TableHead className="text-right w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isManager ? 8 : 7} className="h-24 text-center">
                          Nenhum registro de hora encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeLogs
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((log) => {
                          const project = projects.find((p) => p.id === log.projectId)
                          const task = tasks.find((t) => t.id === log.taskId)
                          const user = users.find((u) => u.id === log.userId)
                          const status = log.status || 'Pending'

                          return (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {format(new Date(log.date), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback>{user?.name.slice(0, 2)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">{user?.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {project?.name || 'Projeto Excluído'}
                              </TableCell>
                              <TableCell>{task?.name || 'N/A'}</TableCell>
                              <TableCell>
                                {status === 'Pending' && (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                  >
                                    Pendente
                                  </Badge>
                                )}
                                {status === 'Approved' && (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  >
                                    Aprovado
                                  </Badge>
                                )}
                                {status === 'Rejected' && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400"
                                  >
                                    Rejeitado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                                {log.hours}h
                              </TableCell>
                              <TableCell className="text-center">
                                <AuditTrailDialog logId={log.id} />
                              </TableCell>
                              {isManager && (
                                <TableCell className="text-right">
                                  {status === 'Pending' ? (
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/50"
                                        onClick={() => handleStatusChange(log, 'Approved')}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
                                        onClick={() => handleStatusChange(log, 'Rejected')}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs pr-4">-</span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
