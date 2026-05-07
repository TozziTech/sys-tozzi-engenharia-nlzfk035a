import { useState } from 'react'
import { ServicoFinanceiro, Parcela, updateServico } from '@/services/servicos_financeiros'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { GerarParcelasModal } from './GerarParcelasModal'
import { Trash2, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandedPaymentRowProps {
  servico: ServicoFinanceiro
}

export function ExpandedPaymentRow({ servico }: ExpandedPaymentRowProps) {
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const parcelas = servico.parcelas || []
  const totalParcelado = parcelas.reduce((acc, p) => acc + p.valor, 0)
  const restante = servico.valor_total - totalParcelado

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handleGenerate = async (novasParcelas: Parcela[]) => {
    await updateServico(servico.id, { parcelas: novasParcelas })
    toast({ title: 'Sucesso', description: 'Parcelas geradas com sucesso.' })
  }

  const handleDelete = async (id: string) => {
    setLoadingId(id)
    try {
      const novas = parcelas.filter((p) => p.id !== id)
      await updateServico(servico.id, { parcelas: novas })
      toast({ title: 'Sucesso', description: 'Parcela removida.' })
    } finally {
      setLoadingId(null)
    }
  }

  const handleToggleStatus = async (id: string) => {
    setLoadingId(id)
    try {
      const novas = parcelas.map((p) => {
        if (p.id === id) {
          const novoStatus = p.status === 'Pago' ? 'Pendente' : 'Pago'
          return {
            ...p,
            status: novoStatus,
            data_pagamento: novoStatus === 'Pago' ? new Date().toISOString() : undefined,
          }
        }
        return p
      })
      await updateServico(servico.id, { parcelas: novas as Parcela[] })
      toast({ title: 'Sucesso', description: 'Status atualizado.' })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 bg-muted/10 rounded-md m-2 border shadow-inner">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h4 className="font-semibold text-base">Gerenciamento de Parcelas</h4>
          <p className="text-sm text-muted-foreground">
            Valor Total do Serviço: {formatCurrency(servico.valor_total)}
          </p>
        </div>
        <GerarParcelasModal servico={servico} onGenerate={handleGenerate} />
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-16 text-muted-foreground">
                  Nenhuma parcela registrada. Use o botão acima para gerar.
                </TableCell>
              </TableRow>
            ) : (
              parcelas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {p.descricao || '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {p.data_vencimento
                      ? new Date(p.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        p.status === 'Pago'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                      )}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatCurrency(p.valor)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(p.id)}
                        disabled={loadingId === p.id}
                        title={p.status === 'Pago' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                      >
                        {p.status === 'Pago' ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                        disabled={loadingId === p.id}
                        title="Excluir Parcela"
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

      <div className="mt-4 flex flex-col sm:flex-row justify-end gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground">Total Parcelado</span>
          <span className="font-semibold text-base">{formatCurrency(totalParcelado)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground">Sub-total Restante</span>
          <span
            className={cn(
              'font-semibold text-base',
              restante > 0.01
                ? 'text-amber-500'
                : restante < -0.01
                  ? 'text-red-500'
                  : 'text-green-600',
            )}
          >
            {formatCurrency(Math.abs(restante))} {restante < -0.01 && '(Excedente)'}
          </span>
        </div>
      </div>
    </div>
  )
}
