import * as React from 'react'
import { ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: Record<string, any>
    children: React.ReactElement
  }
>(({ config, children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      {...props}
      style={{ width: '100%', height: '100%', minHeight: '200px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = 'ChartContainer'

export const ChartTooltip = RechartsTooltip
export const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span className="text-muted-foreground">{p.name || p.dataKey}:</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}
