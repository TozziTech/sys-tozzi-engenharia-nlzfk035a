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
  onEdit: (tx: any) => void
  onDelete: (tx: any) => void
}

export function TransactionTable({
  transactions,
  categories,
  projects,
  onEdit,
  onDelete,
}: TableProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="rounded-md border overflow-hidden bg-card text-card-foreground">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor (R$)</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]">Anexo</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-slate-500">
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
              return (
                <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {tx.description}
                      {tx.is_recurring && (
                        <Repeat className="h-4 w-4 text-slate-400" title="Recorrente" />
                      )}
                    </div>
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
                  <TableCell>
                    {tx.type === 'Entrada' ? (
                      <span className="text-emerald-600 inline-flex items-center font-medium">
                        <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                      </span>
                    ) : (
                      <span className="text-rose-600 inline-flex items-center font-medium">
                        <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(tx.value || tx.amount || 0)}
                  </TableCell>
                  <TableCell>{new Date(tx.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-muted-foreground">{projName}</TableCell>
                  <TableCell>
                    {tx.status === 'Pago' ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Pago</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-500 dark:text-amber-400"
                      >
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tx.attachment && (
                      <Button variant="ghost" size="icon" asChild title="Ver Anexo">
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
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tx)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(tx)} className="text-red-600">
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
