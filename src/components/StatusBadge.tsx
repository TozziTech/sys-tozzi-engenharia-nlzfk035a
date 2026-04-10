import { Badge } from '@/components/ui/badge'
import { Status } from '@/types/project'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors: Record<Status, string> = {
    Planejamento: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
    'Em Andamento': 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
    Concluído: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
    Atrasado: 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200',
  }

  return (
    <Badge
      variant="outline"
      className={cn('rounded-full font-medium whitespace-nowrap', colors[status], className)}
    >
      {status}
    </Badge>
  )
}
