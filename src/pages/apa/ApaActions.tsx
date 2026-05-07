import { useEffect, useState, useMemo } from 'react'
import { format, differenceInDays, startOfDay, parseISO } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, AlertTriangle, PenSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ApaAction = {
  id: string
  description: string
  due_date: string
  status: 'aberta' | 'em_progresso' | 'concluída'
  result: string
  expand?: {
    responsible?: { id: string; name: string }
    apa_report?: {
      expand?: {
        project?: { name: string }
      }
    }
  }
}

const statusMap: Record<string, string> = {
  aberta: 'Aberta',
  em_progresso: 'Em Progresso',
  concluída: 'Concluída',
}

const statusColors: Record<string, string> = {
  aberta: 'bg-zinc-500 hover:bg-zinc-600',
  em_progresso: 'bg-amber-500 hover:bg-amber-600',
  concluída: 'bg-green-600 hover:bg-green-700',
}

export default function ApaActions() {
  const [actions, setActions] = useState<ApaAction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterResponsible, setFilterResponsible] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('')
  const [search, setSearch] = useState('')

  const [editingAction, setEditingAction] = useState<ApaAction | null>(null)
  const [editStatus, setEditStatus] = useState<string>('aberta')
  const [editResult, setEditResult] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const loadActions = async () => {
    try {
      setLoading(true)
      const res = await pb.collection('apa_actions').getFullList({
        expand: 'responsible,apa_report.project',
        sort: 'due_date',
      })
      setActions(res as unknown as ApaAction[])
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao carregar ações', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActions()
  }, [])

  useRealtime('apa_actions', () => {
    loadActions()
  })

  const responsibles = useMemo(() => {
    const users = new Map<string, string>()
    actions.forEach((a) => {
      if (a.expand?.responsible) {
        users.set(a.expand.responsible.id, a.expand.responsible.name)
      }
    })
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }))
  }, [actions])

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      const matchSearch =
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.expand?.apa_report?.expand?.project?.name?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || a.status === filterStatus
      const matchResponsible =
        filterResponsible === 'all' || a.expand?.responsible?.id === filterResponsible
      const matchDate = !filterDate || a.due_date.startsWith(filterDate)

      return matchSearch && matchStatus && matchResponsible && matchDate
    })
  }, [actions, search, filterStatus, filterResponsible, filterDate])

  const handleEdit = (action: ApaAction) => {
    setEditingAction(action)
    setEditStatus(action.status)
    setEditResult(action.result || '')
  }

  const saveAction = async () => {
    if (!editingAction) return
    if (editStatus === 'concluída' && !editResult.trim()) {
      toast({ title: 'Obrigatório informar o resultado', variant: 'destructive' })
      return
    }

    try {
      setIsSaving(true)
      await pb.collection('apa_actions').update(editingAction.id, {
        status: editStatus,
        result: editStatus === 'concluída' ? editResult : '',
      })
      toast({ title: 'Ação atualizada com sucesso' })
      setEditingAction(null)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao atualizar ação', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Ações Corretivas</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Lista de Ações e Melhorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou projeto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] flex-shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_progresso">Em Progresso</SelectItem>
                  <SelectItem value="concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                <SelectTrigger className="w-[180px] flex-shrink-0">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Responsáveis</SelectItem>
                  {responsibles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-[150px]"
                />
                {filterDate && (
                  <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Descrição da Ação</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8">
                      <Skeleton className="h-20 w-full" />
                    </TableCell>
                  </TableRow>
                ) : filteredActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma ação corretiva encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActions.map((action) => {
                    const projectName = action.expand?.apa_report?.expand?.project?.name || '-'
                    const responsibleName = action.expand?.responsible?.name || '-'

                    let diffDays = 0
                    let isOverdue = false

                    if (action.due_date) {
                      const today = startOfDay(new Date())
                      const due = startOfDay(parseISO(action.due_date))
                      diffDays = differenceInDays(due, today)
                      isOverdue = diffDays < 0 && action.status !== 'concluída'
                    }

                    return (
                      <TableRow
                        key={action.id}
                        className={cn(
                          'group cursor-pointer hover:bg-muted/50 transition-colors',
                          isOverdue && 'bg-red-500/10 hover:bg-red-500/20',
                        )}
                        onClick={() => handleEdit(action)}
                      >
                        <TableCell
                          className={cn(
                            'font-medium',
                            isOverdue && 'text-red-600 dark:text-red-400',
                          )}
                        >
                          {projectName}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate" title={action.description}>
                          {action.description}
                        </TableCell>
                        <TableCell>{responsibleName}</TableCell>
                        <TableCell>
                          {action.due_date ? format(parseISO(action.due_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {action.status === 'concluída' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : isOverdue ? (
                            <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" /> Atrasado ({Math.abs(diffDays)}d)
                            </span>
                          ) : (
                            <span
                              className={
                                diffDays <= 3
                                  ? 'text-amber-600 dark:text-amber-500 font-medium'
                                  : ''
                              }
                            >
                              {diffDays} dia(s)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-white',
                              statusColors[action.status] || 'bg-zinc-500',
                            )}
                          >
                            {statusMap[action.status] || action.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingAction} onOpenChange={(open) => !open && setEditingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Ação Corretiva</DialogTitle>
            <DialogDescription>
              Altere o status ou adicione o resultado final desta ação.
            </DialogDescription>
          </DialogHeader>

          {editingAction && (
            <div className="space-y-4 my-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="font-medium text-sm">{editingAction.description}</p>
              </div>

              <div className="space-y-2">
                <Label>Status da Ação</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Aberta</SelectItem>
                    <SelectItem value="em_progresso">Em Progresso</SelectItem>
                    <SelectItem value="concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editStatus === 'concluída' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label>
                    Resultado / Solução Implementada <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Descreva como a ação foi concluída e qual foi o resultado..."
                    value={editResult}
                    onChange={(e) => setEditResult(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAction(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={saveAction} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
