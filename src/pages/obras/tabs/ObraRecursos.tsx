import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export function ObraRecursos({ projectId }: { projectId: string }) {
  const [loans, setLoans] = useState<any[]>([])

  const fetchLoans = async () => {
    const data = await pb.collection('equipment_loans').getFullList({
      filter: `project = "${projectId}"`,
      expand: 'equipment_id,user_id',
      sort: '-loan_date',
    })
    setLoans(data)
  }

  useEffect(() => {
    fetchLoans()
  }, [projectId])
  useRealtime('equipment_loans', fetchLoans)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipamentos Alocados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data de Retirada</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">
                  {loan.expand?.equipment_id?.name || 'Desconhecido'}
                </TableCell>
                <TableCell>{loan.expand?.user_id?.name || 'Desconhecido'}</TableCell>
                <TableCell>
                  {loan.loan_date ? format(new Date(loan.loan_date), 'dd/MM/yyyy') : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={loan.status === 'Ativo' ? 'default' : 'secondary'}>
                    {loan.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {loans.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  Nenhum equipamento alocado para esta obra.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
