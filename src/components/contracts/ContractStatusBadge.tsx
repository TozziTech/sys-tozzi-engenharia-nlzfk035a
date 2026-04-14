import { Badge } from '@/components/ui/badge'

export function ContractStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'Enviado para Assinatura':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Enviado</Badge>
    case 'Assinado':
      return <Badge className="bg-green-500 hover:bg-green-600">Assinado</Badge>
    case 'Cancelado':
      return <Badge variant="destructive">Cancelado</Badge>
    case 'Rascunho':
    default:
      return <Badge variant="secondary">Rascunho</Badge>
  }
}
