import { useState, useMemo } from 'react'
import { FileText, Building2, Droplets, Zap, Paintbrush, Send, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { createComment } from '@/services/client_dashboard'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Building2,
  Droplets,
  Zap,
  Paintbrush,
}

export function TimelineView({ phases, progress }: { phases: any[]; progress: number }) {
  return (
    <div className="relative border-l-2 border-muted ml-3 md:ml-6 space-y-6 pb-4 pt-2">
      {phases.map((phase, index) => {
        const Icon = iconMap[phase.icone] || FileText
        const isCompleted = phase.status === 'Concluído'
        const isInProgress = phase.status === 'Em Andamento'
        const isApproved = phase.status === 'Aprovado'

        const statusColor =
          isCompleted || isApproved
            ? 'text-emerald-600 dark:text-emerald-500'
            : isInProgress
              ? 'text-primary'
              : 'text-muted-foreground'
        const bgColor =
          isCompleted || isApproved ? 'bg-emerald-500' : isInProgress ? 'bg-primary' : 'bg-muted'

        return (
          <div key={phase.id} className="relative pl-6 md:pl-8 group">
            {/* Timeline dot */}
            <div
              className={cn(
                'absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-background shadow-sm transition-colors duration-300',
                bgColor,
                isInProgress && 'animate-pulse',
              )}
            />

            <div
              className={cn(
                'p-4 rounded-lg border bg-card shadow-sm transition-all duration-300 hover:shadow-md',
                isInProgress && 'border-primary/50 shadow-primary/5',
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn('p-2.5 rounded-md bg-muted/50 transition-colors', statusColor)}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground leading-none mb-1.5">
                      {phase.nome_fase}
                    </h4>
                    {phase.data_conclusao_estimada ? (
                      <span className="inline-flex items-center text-xs text-muted-foreground font-medium">
                        <CalendarDays className="w-3.5 h-3.5 mr-1" />
                        Prev: {format(new Date(phase.data_conclusao_estimada), 'dd/MM/yyyy')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Data não definida</span>
                    )}
                  </div>
                </div>

                <Badge
                  variant={
                    isCompleted || isApproved ? 'default' : isInProgress ? 'secondary' : 'outline'
                  }
                  className={cn(
                    'w-fit',
                    isCompleted || isApproved
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : isInProgress
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 border-transparent'
                        : '',
                  )}
                >
                  {phase.status}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-1000 ease-out',
                      isCompleted || isApproved ? 'bg-emerald-500' : 'bg-primary',
                    )}
                    style={{ width: `${phase.progresso || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold w-12 text-right text-muted-foreground">
                  {phase.progresso || 0}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ClientProjectCalendar({ phases, payments }: { phases: any[]; payments: any[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const events = useMemo(() => {
    const evs: any[] = []
    phases.forEach((p) => {
      if (p.data_conclusao_estimada) {
        evs.push({
          date: new Date(p.data_conclusao_estimada),
          title: `Fase: ${p.nome_fase}`,
          type: 'phase',
          status: p.status,
        })
      }
    })
    payments.forEach((p) => {
      if (p.data_vencimento) {
        evs.push({
          date: new Date(p.data_vencimento),
          title: `Pagamento: ${p.descricao}`,
          type: 'payment',
          status: p.status,
        })
      }
    })
    return evs
  }, [phases, payments])

  const selectedEvents = useMemo(() => {
    if (!date) return []
    return events.filter((e) => e.date.toDateString() === date.toDateString())
  }, [date, events])

  const eventDates = events.map((e) => e.date)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Calendário do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={{ hasEvent: eventDates }}
          modifiersStyles={{
            hasEvent: {
              fontWeight: 'bold',
              textDecoration: 'underline',
              textDecorationColor: 'hsl(var(--primary))',
              textUnderlineOffset: '4px',
            },
          }}
          className="rounded-md border shadow-sm w-full max-w-[320px] flex justify-center bg-card"
        />
        <div className="w-full mt-4 space-y-3">
          <h4 className="text-sm font-semibold border-b pb-1">
            {date ? format(date, 'dd/MM/yyyy') : 'Selecione uma data'}
          </h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum evento nesta data.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => (
                <div key={i} className="flex flex-col p-2.5 rounded-md border bg-muted/30 text-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-foreground line-clamp-1" title={ev.title}>
                      {ev.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status: {ev.status}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] h-5 px-1.5 font-medium',
                        ev.type === 'payment'
                          ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-500/10'
                          : 'border-primary text-primary bg-primary/5',
                      )}
                    >
                      {ev.type === 'payment' ? 'Pagamento' : 'Fase'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function CommentsFeed({
  projectId,
  comments,
  user,
}: {
  projectId: string
  comments: any[]
  user: any
}) {
  const [newComment, setNewComment] = useState('')

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return
    try {
      await createComment(projectId, newComment, user.id)
      setNewComment('')
    } catch (err) {
      console.error(err)
    }
  }

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return ''
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={
                  comment.expand?.autor?.avatar
                    ? pb.files.getUrl(comment.expand.autor, comment.expand.autor.avatar)
                    : `https://img.usecurling.com/ppl/thumbnail?seed=${comment.autor}`
                }
              />
              <AvatarFallback>{comment.expand?.autor?.name?.substring(0, 2) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="bg-muted p-3 rounded-lg text-sm flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{comment.expand?.autor?.name || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateStr(comment.created)}
                </span>
              </div>
              <p className="text-muted-foreground">{comment.mensagem}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda.</p>
        )}
      </div>
      <form onSubmit={handleSendComment} className="flex gap-2 mt-4">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newComment.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}

const chartConfig = {
  progress: { label: 'Progresso (%)', color: 'hsl(var(--primary))' },
}

export function EvolutionChart({ phases }: { phases: any[] }) {
  const evolutionData = phases.map((p) => ({
    month: p.nome_fase.substring(0, 15),
    progress: p.progresso || 0,
  }))

  return (
    <div className="h-[250px] w-full mt-4">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evolutionData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
              content={<ChartTooltipContent />}
            />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="var(--color-progress)"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: 'var(--color-progress)',
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-progress)' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
