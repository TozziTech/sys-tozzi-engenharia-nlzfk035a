import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AnimatedProgressProps {
  value: number
  className?: string
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 150)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Progress value={progress} className="h-2 flex-1 transition-all duration-1000 ease-out" />
      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  )
}
