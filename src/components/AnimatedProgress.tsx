import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AnimatedProgressProps {
  value: number
  className?: string
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress value={value} className="h-2 flex-1" />
      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  )
}
