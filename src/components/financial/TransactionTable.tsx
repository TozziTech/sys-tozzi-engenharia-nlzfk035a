import { useState } from 'react'
import {
  Repeat,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Paperclip,
  AlertCircle,
  AlertTriangle,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import pb from '@/lib/pocketbase/client'
import { isBefore, startOfToday, addDays, isWithinInterval, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import { exportFinancialCSV } from '@/lib/export'

interface TableProps {
  transactions: any[]
  categories: any[]
  projects: any[]
  users: any[]
  onEdit: (tx: any) => void
  onDelete: (tx: any) => void
}

export function TransactionTable({
  transactions,
  categories,
  projects,
  users,
  onEdit,
  onDelete,
}: TableProps) {
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [recurrenceFilter, setRecurrenceFilter] = useState('Todos')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const today = startOfToday()
  const next3Days = addDays(today, 3)

  const filteredTransactions = transactions.filter((tx) => {
    let matchStatus = true
    if (statusFilter !== 'Todos') {
      const txStatus = tx.status || 'Pendente'
      matchStatus = txStatus === statusFilter
    }

    let matchType = true
    if (typeFilter !== 'Todos') {
      matchType = tx.type === typeFilter
    }

    let matchRecurrence = true
    if (recurrenceFilter === 'Recorrentes') matchRecurrence = !!tx.is_recurring
    if (recurrenceFilter === 'Eventuais') matchRecurrence = !tx.is_recurring

    return matchStatus && matchType && matchRecurrence
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-2" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Tipos</SelectItem>
              <SelectItem value="Entrada">Entrada</SelectItem>
              <SelectItem value="Saída">Saída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={recurrenceFilter} onValueChange={setRecurrenceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Recorrência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas as Recorrências</SelectItem>
              <SelectItem value="Recorrentes">Recorrentes</SelectItem>
              <SelectItem value="Eventuais">Eventuais</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              const dataToExport = filteredTransactions.map((tx) => {
                const cId = tx.categoryId || tx.category
                const cat = categories.find((c: any) => c.id === cId || c.name === cId)
                return {
                  ...tx,
                  category: cat ? cat.name : 'Sem categoria',
                }
              })
              exportFinancialCSV(dataToExport, 'Filtrado')
            }}
            className="ml-auto sm:ml-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Exibindo {filteredTransactions.length} de {transactions.length} registros
        </div>
      </div>
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-card text-card-foreground">
        <Table>
          <TableHeader className="bg-zinc-100 dark:bg-zinc-900/80">
            <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Código
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Data
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Tipo
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Categoria
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Descrição
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Projeto
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Responsável
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Status
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Aprovação
              </TableHead>
              <TableHead className="font-semibold text-center text-zinc-700 dark:text-zinc-300">
                Valor
              </TableHead>
              <TableHead className="w-[60px] text-center font-semibold text-zinc-700 dark:text-zinc-300">
                Anexo
              </TableHead>
              <TableHead className="w-[60px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-12 text-slate-500 dark:text-zinc-500"
                >
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx: any) => {
                const cId = tx.categoryId || tx.category
                const pId = tx.projectId || tx.project_id
                const cat = categories.find((c: any) => c.id === cId || c.name === cId)
                const projName =
                  pId === 'tozzi_interno'
                    ? 'TOZZI (Interno)'
                    : projects.find((p: any) => p.id === pId)?.name || 'TOZZI (Interno)'
                const respUser = users.find((u: any) => u.id === tx.responsible)

                const txStatus = tx.status || 'Pendente'
                const isPending = txStatus === 'Pendente'
                let isOverdue = false
                let isUpcoming = false

                if (isPending && tx.date) {
                  const dateStr = String(tx.date).split('T')[0].split(' ')[0]
                  const date = parseISO(dateStr)
                  if (isBefore(date, today)) {
                    isOverdue = true
                  } else if (isWithinInterval(date, { start: today, end: next3Days })) {
                    isUpcoming = true
                  }
                }

                return (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 transition-colors"
                  >
                    <TableCell className="whitespace-nowrap text-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {tx.code || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={
                            isOverdue
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : isUpcoming
                                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                : ''
                          }
                        >
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                            : '-'}
                        </span>
                        {isOverdue && (
                          <AlertCircle
                            className="h-4 w-4 text-red-600 dark:text-red-400"
                            title="Vencido"
                          />
                        )}
                        {isUpcoming && (
                          <AlertTriangle
                            className="h-4 w-4 text-amber-500 dark:text-amber-400"
                            title="Vencendo em breve"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.type === 'Entrada' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center font-medium">
                          <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 inline-flex items-center justify-center font-medium">
                          <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {cat ? (
                        <Badge
                          variant="outline"
                          style={{ borderColor: cat.color, color: cat.color }}
                        >
                          {cat.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-border">
                          Sem categoria
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-center text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center justify-center gap-2">
                        <span>{tx.description}</span>
                        {tx.is_recurring && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 text-[10px] py-0 h-5 text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 whitespace-nowrap"
                            title="Recorrente"
                          >
                            <Repeat className="h-3 w-3" />
                            Recorrente {tx.frequency ? `- ${tx.frequency}` : ''}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-zinc-600 dark:text-zinc-400">
                      {projName}
                    </TableCell>
                    <TableCell className="text-center text-zinc-600 dark:text-zinc-400">
                      {respUser ? respUser.name || respUser.email : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {txStatus === 'Pago' && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
                          Pago
                        </Badge>
                      )}
                      {txStatus === 'Pendente' && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-500 dark:text-amber-400"
                        >
                          Pendente
                        </Badge>
                      )}
                      {txStatus === 'Atrasado' && <Badge variant="destructive">Atrasado</Badge>}
                      {txStatus === 'Cancelado' && (
                        <Badge variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-300">
                          Cancelado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.type === 'Saída' ? (
                        tx.is_approved ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                          >
                            Aprovado
                          </Badge>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                            >
                              Pendente
                            </Badge>
                            {/* Assumes we have Admin/Manager check here or rely on backend rules, simple button for demonstration */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  await pb
                                    .collection('financial_records')
                                    .update(tx.id, {
                                      is_approved: true,
                                      approved_by: pb.authStore.record?.id,
                                    })
                                } catch (err) {
                                  console.error(err)
                                }
                              }}
                            >
                              Aprovar
                            </Button>
                          </div>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatCurrency(tx.value || tx.amount || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.attachment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Ver Anexo"
                          className="hover:text-amber-500 dark:hover:text-amber-400"
                        >
                          <a
                            href={pb.files.getURL(
                              {
                                id: tx.id,
                                collectionId: tx.collectionId || 'financial_records',
                              } as any,
                              tx.attachment,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Paperclip className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-amber-500 dark:hover:text-amber-400"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="dark:bg-zinc-900 dark:border-zinc-800"
                        >
                          <DropdownMenuItem
                            onClick={() => onEdit(tx)}
                            className="focus:text-amber-500 dark:focus:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-950/30 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(tx)}
                            className="text-red-600 focus:text-red-600 dark:focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
