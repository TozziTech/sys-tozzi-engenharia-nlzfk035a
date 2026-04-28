import { useState, useEffect } from 'react'
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
import { getServicos, deleteServico, type ServicoFinanceiro } from '@/services/servicos_financeiros'
import { ServicoModal } from './ServicoModal'
import { useRealtime } from '@/hooks/use-realtime'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ServicosList() {
  const [servicos, setServicos] = useState<ServicoFinanceiro[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getServicos()
      setServicos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('servicos_financeiros', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return
    try {
      await deleteServico(id)
      toast({ title: 'Sucesso', description: 'Serviço excluído com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Serviços Financeiros</CardTitle>
        <ServicoModal />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Serviço/Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && servicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : servicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                    Nenhum serviço registrado.
                  </TableCell>
                </TableRow>
              ) : (
                servicos.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {servico.codigo}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{servico.projeto_servico}</TableCell>
                    <TableCell className="whitespace-nowrap">{servico.cliente || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(servico.data_inicio).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getStatusColor(servico.status)} variant="outline">
                        {servico.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatCurrency(servico.valor_total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <ServicoModal servico={servico} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(servico.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
  )
}
