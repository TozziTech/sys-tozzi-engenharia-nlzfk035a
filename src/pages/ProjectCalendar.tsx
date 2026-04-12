import React, { useState, useEffect, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

export default function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [projects, setProjects] = useState<any[]>([])

  const loadProjects = async () => {
    try {
      const res = await pb.collection('projects').getFullList()
      setProjects(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])
  useRealtime('projects', () => loadProjects())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const events: Record<string, any[]> = {}
    projects.forEach((p) => {
      if (p.start_date && p.status !== 'Concluído') {
        const sDate = format(new Date(p.start_date), 'yyyy-MM-dd')
        if (!events[sDate]) events[sDate] = []
        events[sDate].push({ project: p, type: 'start' })
      }
      if (p.end_date && p.status !== 'Concluído') {
        const eDate = format(new Date(p.end_date), 'yyyy-MM-dd')
        if (!events[eDate]) events[eDate] = []
        events[eDate].push({ project: p, type: 'end' })
      }
    })
    return events
  }, [projects])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Calendário de Operações
        </h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe os prazos de início e entrega dos projetos ativos.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[800px] border rounded-lg overflow-hidden bg-muted/10">
              <div className="grid grid-cols-7 bg-muted/30 border-b">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                  <div
                    key={d}
                    className="p-3 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-border">
                {days.map((day, i) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDate[dateKey] || []
                  return (
                    <div
                      key={i}
                      className={cn(
                        'min-h-[140px] p-2 bg-background transition-colors',
                        !isSameMonth(day, currentDate) && 'bg-muted/30 text-muted-foreground/50',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={cn(
                            'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                            isToday(day) ? 'bg-primary text-primary-foreground shadow-sm' : '',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {dayEvents.map((e, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'text-[11px] leading-tight px-1.5 py-1 rounded-sm truncate font-medium border transition-colors hover:brightness-95 cursor-default',
                              e.type === 'start'
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
                            )}
                            title={`${e.type === 'start' ? 'Início' : 'Entrega'}: ${e.project.name}`}
                          >
                            <span className="mr-1">{e.type === 'start' ? '🟢' : '🔴'}</span>
                            {e.project.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
