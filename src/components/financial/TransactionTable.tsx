import {
  Repeat,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Paperclip,
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
import pb from '@/lib/pocketbase/client'

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
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-card text-card-foreground">
      <Table>
        <TableHeader className="bg-zinc-100 dark:bg-zinc-900/80">
          <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Data</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Tipo</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
              Categoria
            </TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
              Descrição
            </TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
              Projeto
            </TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
              Responsável
            </TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Status</TableHead>
            <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 text-right">
              Valor
            </TableHead>
            <TableHead className="w-[60px] text-center font-semibold text-zinc-700 dark:text-zinc-300">
              Anexo
            </TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center py-12 text-slate-500 dark:text-zinc-500"
              >
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx: any) => {
              const cId = tx.categoryId || tx.category
              const pId = tx.projectId || tx.project_id
              const cat = categories.find((c: any) => c.id === cId || c.name === cId)
              const projName =
                pId === 'tozzi_interno'
                  ? 'TOZZI (Interno)'
                  : projects.find((p: any) => p.id === pId)?.name || 'TOZZI (Interno)'
              const respUser = users.find((u: any) => u.id === tx.responsible)

              return (
                <TableRow
                  key={tx.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 transition-colors"
                >
                  <TableCell className="whitespace-nowrap">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {tx.type === 'Entrada' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center font-medium">
                        <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 inline-flex items-center font-medium">
                        <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {cat ? (
                      <Badge variant="outline" style={{ borderColor: cat.color, color: cat.color }}>
                        {cat.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-border">
                        Sem categoria
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      {tx.description}
                      {tx.is_recurring && (
                        <Repeat
                          className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
                          title="Recorrente"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">{projName}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {respUser ? respUser.name || respUser.email : '-'}
                  </TableCell>
                  <TableCell>
                    {tx.status === 'Pago' && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
                        Pago
                      </Badge>
                    )}
                    {tx.status === 'Pendente' && (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-500 dark:text-amber-400"
                      >
                        Pendente
                      </Badge>
                    )}
                    {tx.status === 'Atrasado' && <Badge variant="destructive">Atrasado</Badge>}
                    {tx.status === 'Cancelado' && (
                      <Badge variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-300">
                        Cancelado
                      </Badge>
                    )}
                    {!tx.status && (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-500 dark:text-amber-400"
                      >
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
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
                  <TableCell>
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
  )
}
