import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApaReport } from './ApaHistory'
import { cn } from '@/lib/utils'

type ApaAction = {
  id: string
  description: string
  due_date: string
  status: string
  expand?: { responsible?: { name: string } }
}

const statusMap: Record<string, string> = {
  aberta: 'Aberta',
  em_progresso: 'Em Progresso',
  concluída: 'Concluída',
}

const statusColors: Record<string, string> = {
  aberta: 'bg-zinc-500',
  em_progresso: 'bg-amber-500',
  concluída: 'bg-green-600',
}

export function ApaDetailModal({
  report,
  open,
  onOpenChange,
}: {
  report: ApaReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [actions, setActions] = useState<ApaAction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && report) {
      setLoading(true)
      pb.collection('apa_actions')
        .getFullList({
          filter: `apa_report = "${report.id}"`,
          expand: 'responsible',
          sort: '-created',
        })
        .then((res) => setActions(res as unknown as ApaAction[]))
        .finally(() => setLoading(false))
    }
  }, [open, report])

  if (!report) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl">Detalhes da Análise Pós-Ação</DialogTitle>
          <DialogDescription className="text-base mt-2">
            <span className="font-semibold text-foreground">Projeto:</span>{' '}
            {report.expand?.project?.name || '-'} |{' '}
            <span className="font-semibold text-foreground">Data:</span>{' '}
            {format(new Date(report.created), 'dd/MM/yyyy')} |{' '}
            <span className="font-semibold text-foreground">Criado Por:</span>{' '}
            {report.expand?.created_by?.name || '-'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-green-600 dark:text-green-500">
                Pontos Positivos
              </h4>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-border/50">
                {report.positive_points}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-red-600 dark:text-red-500">
                Pontos Negativos / Gargalos
              </h4>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-border/50">
                {report.negative_points}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-500">
                Lições Aprendidas
              </h4>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-border/50">
                {report.lessons_learned}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-amber-600 dark:text-amber-500">
                Plano de Ação Corretiva
              </h4>
              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap min-h-[100px] border border-border/50">
                {report.corrective_plan}
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-lg mb-4 border-b pb-2">
            Ações de Melhoria Relacionadas
          </h4>
          {loading ? (
            <Skeleton className="h-32 w-full rounded-md" />
          ) : (
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Descrição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhuma ação vinculada a esta análise.
                      </TableCell>
                    </TableRow>
                  )}
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell
                        className="font-medium max-w-[300px] truncate"
                        title={action.description}
                      >
                        {action.description}
                      </TableCell>
                      <TableCell>{action.expand?.responsible?.name || '-'}</TableCell>
                      <TableCell>
                        {action.due_date ? format(new Date(action.due_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-white hover:opacity-90',
                            statusColors[action.status] || 'bg-zinc-500',
                          )}
                        >
                          {statusMap[action.status] || action.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
