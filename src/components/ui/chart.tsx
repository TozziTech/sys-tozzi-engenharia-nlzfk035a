import * as React from 'react'
import { ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts'

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

export const ChartLegend = RechartsLegend

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    payload?: any[]
    verticalAlign?: string
    align?: string
    nameKey?: string
  }
>(({ className, payload, verticalAlign, align, nameKey, ...props }, ref) => {
  if (!payload || !payload.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center flex-wrap gap-4 pt-3 ${verticalAlign === 'top' ? 'pb-3' : 'pt-3'} ${className || ''}`}
      {...props}
    >
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <span className="text-sm font-medium text-muted-foreground">
            {nameKey ? item.payload?.[nameKey] || item.value : item.value}
          </span>
        </div>
      ))}
    </div>
  )
})
ChartLegendContent.displayName = 'ChartLegendContent'
