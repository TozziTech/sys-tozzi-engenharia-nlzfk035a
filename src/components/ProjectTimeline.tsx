import { useMemo } from 'react'
import {
  format,
  differenceInDays,
  parseISO,
  min,
  max,
  addDays,
  subDays,
  eachDayOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function ProjectTimeline({ modules, project }: { modules: any[]; project: any }) {
  const { allDays, months, chartStart } = useMemo(() => {
    const today = new Date()
    const dates = modules.flatMap((m) => {
      try {
        return [
          m.start_date ? parseISO(m.start_date.split(' ')[0]) : null,
          m.deadline ? parseISO(m.deadline.split(' ')[0]) : null,
        ].filter(Boolean) as Date[]
      } catch (e) {
        return []
      }
    })

    if (project.start_date) dates.push(parseISO(project.start_date.split(' ')[0]))
    if (project.end_date) dates.push(parseISO(project.end_date.split(' ')[0]))

    const minD = dates.length ? min(dates) : subDays(today, 7)
    const maxD = dates.length ? max(dates) : addDays(today, 30)

    const start = subDays(minD, 7)
    const end = addDays(maxD, 14)
    const days = eachDayOfInterval({ start, end })

    const mths: { name: string; days: number }[] = []
    let curM = '',
      cnt = 0
    days.forEach((d) => {
      const m = format(d, 'MMM yyyy', { locale: ptBR })
      if (m !== curM) {
        if (curM) mths.push({ name: curM, days: cnt })
        curM = m
        cnt = 1
      } else cnt++
    })
    if (curM) mths.push({ name: curM, days: cnt })

    return { allDays: days, months: mths, chartStart: start }
  }, [modules, project])

  const dw = 24
  const totalWidth = allDays.length * dw

  const getStatusColor = (s: string) => {
    if (s === 'Em Andamento') return 'bg-blue-500'
    if (s === 'Concluído') return 'bg-emerald-500'
    if (s === 'Pausado') return 'bg-amber-500'
    return 'bg-slate-400'
  }

  const sortedModules = [...modules].sort((a, b) => {
    const dA = a.start_date ? new Date(a.start_date).getTime() : 0
    const dB = b.start_date ? new Date(b.start_date).getTime() : 0
    return dA - dB
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma de Disciplinas (Gantt)</CardTitle>
        <CardDescription>Visualização temporal do andamento do projeto.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full border rounded-lg bg-card">
          <div className="flex min-w-max w-full">
            <div className="w-64 flex-shrink-0 sticky left-0 z-30 bg-card border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
              <div className="h-10 border-b flex items-center px-4 font-semibold text-xs text-muted-foreground uppercase sticky top-0 bg-card z-40">
                Disciplina
              </div>
              {sortedModules.map((m) => (
                <div key={m.id} className="h-10 border-b flex flex-col justify-center px-4 bg-card">
                  <span className="truncate text-xs font-medium" title={m.name}>
                    {m.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative flex-1" style={{ width: totalWidth, minWidth: totalWidth }}>
              <div className="h-10 border-b flex sticky top-0 z-20 bg-muted/50 backdrop-blur">
                {months.map((m) => (
                  <div
                    key={m.name}
                    className="border-r flex items-center px-2 text-[10px] font-semibold text-muted-foreground uppercase overflow-hidden"
                    style={{ width: m.days * dw }}
                  >
                    <span className="truncate">{m.name}</span>
                  </div>
                ))}
              </div>

              <div
                className="absolute inset-0 top-10 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px)`,
                  backgroundSize: `${dw}px 100%`,
                }}
              />

              <div className="flex flex-col w-full relative">
                {sortedModules.map((m) => {
                  let sDay = 0
                  let dur = 0
                  try {
                    const mStart = m.start_date ? parseISO(m.start_date.split(' ')[0]) : chartStart
                    const mEnd = m.deadline
                      ? parseISO(m.deadline.split(' ')[0])
                      : addDays(mStart, 1)
                    sDay = differenceInDays(mStart, chartStart)
                    dur = differenceInDays(mEnd, mStart) + 1
                  } catch {
                    /* intentionally ignored */
                  }

                  if (sDay < 0) {
                    dur += sDay
                    sDay = 0
                  }

                  return (
                    <div
                      key={m.id}
                      className="h-10 border-b border-border/50 w-full relative flex items-center hover:bg-muted/30 transition-colors group"
                    >
                      {dur > 0 && (
                        <div
                          className={cn(
                            'absolute h-6 rounded shadow-sm overflow-hidden transition-all flex items-center hover:brightness-110 hover:ring-2 hover:ring-primary/50',
                            getStatusColor(m.status),
                          )}
                          style={{ left: sDay * dw, width: Math.max(dur * dw, 8) }}
                          title={`${m.name} (${m.progress || 0}%)`}
                        >
                          <div
                            className="h-full bg-black/20"
                            style={{ width: `${m.progress || 0}%` }}
                          />
                          {dur * dw > 30 && (
                            <span className="absolute left-1 text-[9px] text-white font-medium drop-shadow">
                              {m.progress || 0}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
