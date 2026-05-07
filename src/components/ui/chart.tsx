import * as React from 'react'
import { ResponsiveContainer, Tooltip, TooltipProps } from 'recharts'
import { cn } from '@/lib/utils'

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: Record<string, { label?: React.ReactNode; color?: string; icon?: React.ComponentType }>
    children: React.ReactElement
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId}`

  return (
    <div
      ref={ref}
      data-chart={chartId}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/50 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className,
      )}
      {...props}
    >
      <style>
        {Object.entries(config).map(([key, itemConfig]) => {
          if (!itemConfig.color) return null
          return `
            [data-chart=${chartId}] {
              --color-${key}: ${itemConfig.color};
            }
          `
        })}
      </style>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = 'ChartContainer'

export const ChartTooltip = Tooltip

export function ChartTooltipContent({
  active,
  payload,
  label,
  indicator = 'dot',
}: TooltipProps<any, any> & { indicator?: 'line' | 'dot' | 'dashed' }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl z-50">
      {label && <div className="font-medium text-foreground mb-1">{label}</div>}
      {payload.map((item: any, index: number) => {
        return (
          <div key={index} className="flex w-full items-center gap-2">
            {indicator === 'dot' && (
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: item.color || item.payload?.fill || 'var(--color-primary)',
                }}
              />
            )}
            <span className="flex-1 text-muted-foreground">{item.name || item.dataKey}</span>
            <span className="font-medium tabular-nums text-foreground">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}
