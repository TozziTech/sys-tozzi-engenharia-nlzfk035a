import { useState } from 'react'
import { FileDown, Plus, Search, Info, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { QuoteGeneratorModal, type QuoteData } from '@/components/QuoteGeneratorModal'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportQuotePDF } from '@/lib/exportPdf'

const INITIAL_QUOTES: QuoteData[] = [
  {
    id: 'ORC-2023-001',
    clientName: 'Construtora Alpha',
    projectName: 'Reforma Comercial',
    date: '10/05/2023',
    value: 15000,
    status: 'Aprovado',
    items: [{ id: '1', description: 'Reforma Comercial', quantity: 1, unitPrice: 15000 }],
  },
  {
    id: 'ORC-2023-002',
    clientName: 'Residencial Betel',
    projectName: 'Projeto Arquitetônico',
    date: '12/05/2023',
    value: 8500,
    status: 'Pendente',
    items: [{ id: '2', description: 'Projeto Arquitetônico', quantity: 1, unitPrice: 8500 }],
  },
  {
    id: 'ORC-2023-003',
    clientName: 'Prefeitura Municipal',
    projectName: 'Paisagismo Praça Central',
    date: '15/05/2023',
    value: 45000,
    status: 'Enviado',
    items: [{ id: '3', description: 'Paisagismo', quantity: 1, unitPrice: 45000 }],
  },
  {
    id: 'ORC-2023-004',
    clientName: 'Clínica Médica Silva',
    projectName: 'Adequação de Acessibilidade',
    date: '18/05/2023',
    value: 12000,
    status: 'Pendente',
    items: [{ id: '4', description: 'Adequação', quantity: 1, unitPrice: 12000 }],
  },
]

export default function Quotes() {
  const [quotes, setQuotes] = useState<QuoteData[]>(INITIAL_QUOTES)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const { toast } = useToast()

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'Aprovado':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
            Aprovado
          </Badge>
        )
      case 'Enviado':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Enviado</Badge>
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pendente</Badge>
        )
    }
  }

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'Todos' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDownload = (quote: QuoteData) => {
    exportQuotePDF(quote)
    toast({
      title: 'Download iniciado',
      description: 'O orçamento está sendo baixado em PDF.',
    })
  }

  const totalEmAberto = filteredQuotes
    .filter((q) => q.status === 'Pendente' || q.status === 'Enviado')
    .reduce((sum, q) => sum + (q.value || 0), 0)

  const totalAprovado = filteredQuotes
    .filter((q) => q.status === 'Aprovado')
    .reduce((sum, q) => sum + (q.value || 0), 0)

  const valorTotalEstimado = filteredQuotes.reduce((sum, q) => sum + (q.value || 0), 0)

  const handleDelete = (id: string) => {
    setQuotes(quotes.filter((q) => q.id !== id))
    toast({
      title: 'Proposta excluída',
      description: 'A proposta foi removida com sucesso.',
    })
  }

  const handleSave = (data: QuoteData) => {
    if (data.id) {
      setQuotes(
        quotes.map((q) =>
          q.id === data.id
            ? {
                ...q,
                ...data,
                value: data.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
              }
            : q,
        ),
      )
      toast({
        title: 'Proposta atualizada',
        description: 'As alterações foram salvas com sucesso.',
      })
    } else {
      const newQuote: QuoteData = {
        ...data,
        id: `ORC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`,
        date: new Intl.DateTimeFormat('pt-BR').format(new Date()),
        status: 'Pendente',
        value: data.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
      }
      setQuotes([newQuote, ...quotes])
      toast({
        title: 'Proposta criada',
        description: 'Nova proposta adicionada com sucesso.',
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Histórico de Propostas</h2>
            <p className="text-muted-foreground">
              Acompanhe e gerencie todas as propostas comerciais geradas.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground h-8 w-8 -mt-6"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>Os dados atuais são locais e serão perdidos ao recarregar a página.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <QuoteGeneratorModal onSave={handleSave}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nova Proposta
          </Button>
        </QuoteGeneratorModal>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEmAberto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aprovado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAprovado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotalEstimado)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 py-4 mt-2">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou projeto..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Enviado">Enviado</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <p className="text-muted-foreground">Nenhuma proposta encontrada.</p>
                    <QuoteGeneratorModal onSave={handleSave}>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Criar Primeira Proposta
                      </Button>
                    </QuoteGeneratorModal>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.clientName}</TableCell>
                  <TableCell>{quote.projectName}</TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quote.value)}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(quote)}
                        title="Exportar PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <QuoteGeneratorModal initialData={quote} onSave={handleSave}>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </QuoteGeneratorModal>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a proposta para{' '}
                              <strong>{quote.clientName}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(quote.id!)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
