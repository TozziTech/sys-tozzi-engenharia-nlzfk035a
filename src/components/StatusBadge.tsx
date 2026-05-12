import { Badge } from '@/components/ui/badge'
import { Status } from '@/types/project'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: Status
  endDate?: string
  className?: string
}

export function StatusBadge({ status, endDate, className }: StatusBadgeProps) {
  const colors: Record<Status, string> = {
    Planejamento: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
    'Em Andamento': 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    Concluído:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    Atrasado: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    'Aguardando Pagamento':
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    'Em Correção':
      'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
    'Em Análise':
      'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  }

  const badgeClass =
    colors[status] || 'bg-secondary text-secondary-foreground hover:bg-secondary/80'

  let isCritical = false
  if (endDate && status !== 'Concluído' && status !== 'Atrasado') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays >= 0 && diffDays <= 3) {
      isCritical = true
    }
  }

  if (isCritical) {
    return (
      <span className="contents">
        <Badge
          variant="outline"
          className={cn(
            'rounded-full font-medium whitespace-nowrap bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
            className,
          )}
        >
          Crítico (≤3 dias)
        </Badge>
      </span>
    )
  }

  return (
    <span className="contents">
      <Badge
        variant="outline"
        className={cn('rounded-full font-medium whitespace-nowrap', badgeClass, className)}
      >
        {status}
      </Badge>
    </span>
  )
}
