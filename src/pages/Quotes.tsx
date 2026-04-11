import { useState } from 'react'
import { FileDown, MoreHorizontal, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { QuoteGeneratorModal } from '@/components/QuoteGeneratorModal'
import { useToast } from '@/hooks/use-toast'

const MOCK_QUOTES = [
  {
    id: 'ORC-2023-001',
    client: 'Construtora Alpha',
    date: '10/05/2023',
    value: 15000,
    status: 'Aprovado',
  },
  {
    id: 'ORC-2023-002',
    client: 'Residencial Betel',
    date: '12/05/2023',
    value: 8500,
    status: 'Pendente',
  },
  {
    id: 'ORC-2023-003',
    client: 'Prefeitura Municipal',
    date: '15/05/2023',
    value: 45000,
    status: 'Rejeitado',
  },
  {
    id: 'ORC-2023-004',
    client: 'Clínica Médica Silva',
    date: '18/05/2023',
    value: 12000,
    status: 'Pendente',
  },
]

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
            Aprovado
          </Badge>
        )
      case 'Rejeitado':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Rejeitado</Badge>
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pendente</Badge>
        )
    }
  }

  const filteredQuotes = MOCK_QUOTES.filter(
    (q) =>
      q.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDownload = () => {
    toast({
      title: 'Download iniciado',
      description: 'O orçamento está sendo baixado em PDF.',
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orçamentos</h2>
          <p className="text-muted-foreground">
            Gerencie e gere propostas comerciais para seus clientes.
          </p>
        </div>
        <QuoteGeneratorModal>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
          </Button>
        </QuoteGeneratorModal>
      </div>

      <div className="flex items-center space-x-2 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou ID..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificação</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.id}</TableCell>
                  <TableCell>{quote.client}</TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quote.value)}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={handleDownload} title="Baixar PDF">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Mais opções">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
