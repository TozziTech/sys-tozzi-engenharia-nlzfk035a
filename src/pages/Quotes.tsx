import { useState } from 'react'
import { FileDown, MoreHorizontal, Plus, Search, Info } from 'lucide-react'
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
import { QuoteGeneratorModal } from '@/components/QuoteGeneratorModal'
import { useToast } from '@/hooks/use-toast'

const MOCK_QUOTES = [
  {
    id: 'ORC-2023-001',
    client: 'Construtora Alpha',
    project: 'Reforma Comercial',
    date: '10/05/2023',
    value: 15000,
    status: 'Aprovado',
  },
  {
    id: 'ORC-2023-002',
    client: 'Residencial Betel',
    project: 'Projeto Arquitetônico',
    date: '12/05/2023',
    value: 8500,
    status: 'Pendente',
  },
  {
    id: 'ORC-2023-003',
    client: 'Prefeitura Municipal',
    project: 'Paisagismo Praça Central',
    date: '15/05/2023',
    value: 45000,
    status: 'Enviado',
  },
  {
    id: 'ORC-2023-004',
    client: 'Clínica Médica Silva',
    project: 'Adequação de Acessibilidade',
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
      case 'Enviado':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Enviado</Badge>
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pendente</Badge>
        )
    }
  }

  const filteredQuotes = MOCK_QUOTES.filter(
    (q) =>
      q.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.project.toLowerCase().includes(searchTerm.toLowerCase()),
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
              <p>
                Os dados atuais são temporários. Conecte um banco de dados (Supabase ou Skip Cloud)
                para persistência permanente.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <QuoteGeneratorModal>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nova Proposta
          </Button>
        </QuoteGeneratorModal>
      </div>

      <div className="flex items-center space-x-2 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou projeto..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                    <QuoteGeneratorModal>
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
                  <TableCell className="font-medium">{quote.client}</TableCell>
                  <TableCell>{quote.project}</TableCell>
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
