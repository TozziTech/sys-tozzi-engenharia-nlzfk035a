import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, History, Edit, FileText, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportDistributionCSV } from '@/lib/export'
import { exportDistributionPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'

interface Props {
  history: any[]
  onDelete: (id: string) => void
  onEdit: (record: any) => void
}

export function DistributionHistoryTable({ history, onDelete, onEdit }: Props) {
  const { user } = useAuth()
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handleExportCSV = () => {
    exportDistributionCSV(history)
  }

  const handleExportPDF = () => {
    exportDistributionPDF(history, user?.name || user?.email || 'Usuário')
  }

  return (
    <Card className="border-border/50 shadow-sm mt-6 w-full animate-fade-in-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Histórico de Lançamentos
          </CardTitle>
          <CardDescription>Listagem de todas as distribuições calculadas e salvas.</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="rounded-md border border-border/50 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] whitespace-nowrap">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total Bruto</TableHead>
                <TableHead className="text-right whitespace-nowrap">NF (R$)</TableHead>
                <TableHead className="text-right whitespace-nowrap">ART (R$)</TableHead>
                <TableHead className="text-right whitespace-nowrap">Despesas</TableHead>
                <TableHead className="text-right whitespace-nowrap">Cap. Giro</TableHead>
                <TableHead className="text-right whitespace-nowrap">Líquido</TableHead>
                <TableHead className="text-right text-emerald-600 dark:text-emerald-500 whitespace-nowrap">
                  Samuel
                </TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-500 whitespace-nowrap">
                  Tozzi
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                    Nenhum histórico de distribuição encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => {
                  const cgAmount = item.total_amount * ((item.working_capital_pct || 0) / 100)

                  return (
                    <TableRow key={item.id} className="group transition-colors">
                      <TableCell className="whitespace-nowrap font-medium text-muted-foreground">
                        {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell
                        className="font-medium max-w-[200px] truncate"
                        title={item.description}
                      >
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.nf_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.art_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.expenses || 0)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(cgAmount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {formatCurrency(item.net_value)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-emerald-600 dark:text-emerald-500 font-semibold">
                        {formatCurrency(item.samuel_amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-blue-600 dark:text-blue-500 font-semibold">
                        {formatCurrency(item.tozzi_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-all"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
  )
}
