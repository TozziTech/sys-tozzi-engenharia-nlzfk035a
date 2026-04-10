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
    Planejamento:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    'Em Andamento':
      'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    Concluído:
      'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    Atrasado:
      'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  }

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
      <Badge
        variant="outline"
        className={cn(
          'rounded-full font-medium whitespace-nowrap bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
          className,
        )}
      >
        Crítico (≤3 dias)
      </Badge>
    )
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
