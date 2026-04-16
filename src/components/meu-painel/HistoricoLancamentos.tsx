import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

export function HistoricoLancamentos() {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await pb.collection('distribution_calculations').getFullList({
        sort: '-date,-created',
      })
      setRecords(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('distribution_calculations', loadData)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold">Histórico de Lançamentos</h3>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto shadow-sm w-full">
        <TooltipProvider>
          <Table className="w-full table-fixed min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] whitespace-nowrap">Data</TableHead>
                <TableHead className="w-auto">Descrição</TableHead>
                <TableHead className="w-[130px] text-right whitespace-nowrap">
                  Valor Total
                </TableHead>
                <TableHead className="w-[110px] text-right whitespace-nowrap">NF</TableHead>
                <TableHead className="w-[110px] text-right whitespace-nowrap">ART</TableHead>
                <TableHead className="w-[140px] text-right whitespace-nowrap">
                  Valor Líquido
                </TableHead>
                <TableHead className="w-[130px] text-right whitespace-nowrap">Samuel</TableHead>
                <TableHead className="w-[130px] text-right whitespace-nowrap">Tozzi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Carregando lançamentos...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate cursor-default text-left w-full block">
                            {r.description || '-'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-[400px] whitespace-normal break-words z-50"
                        >
                          <p>{r.description || '-'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium">
                      {formatCurrency(r.total_amount)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatCurrency(r.nf_amount)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatCurrency(r.art_amount)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium text-primary">
                      {formatCurrency(r.net_value)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatCurrency(r.samuel_amount)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatCurrency(r.tozzi_amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  )
}
