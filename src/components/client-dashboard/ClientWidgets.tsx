import { useState } from 'react'
import { FileText, Building2, Droplets, Zap, Paintbrush, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { createComment } from '@/services/client_dashboard'

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Building2,
  Droplets,
  Zap,
  Paintbrush,
}

export function TimelineView({ phases, progress }: { phases: any[]; progress: number }) {
  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-hide">
      <div className="relative flex justify-between w-full min-w-[700px] px-8">
        <div className="absolute top-6 left-8 right-8 h-1 bg-secondary -z-10 rounded-full" />
        <div
          className="absolute top-6 left-8 h-1 bg-primary -z-10 rounded-full transition-all duration-1000 ease-in-out"
          style={{ width: `${progress}%` }}
        />
        {phases.map((phase) => {
          const Icon = iconMap[phase.icone] || FileText
          const isCompleted = phase.status === 'Concluído'
          const isInProgress = phase.status === 'Em Andamento'

          return (
            <div key={phase.id} className="flex flex-col items-center gap-3 relative group">
              <div className="bg-card px-2">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-4 z-10 transition-all duration-300',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : isInProgress
                        ? 'bg-blue-500 border-blue-200 text-white dark:border-blue-900 shadow-md scale-110'
                        : 'bg-secondary border-muted text-muted-foreground',
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-center w-28">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors duration-300 line-clamp-1',
                    isCompleted || isInProgress ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {phase.nome_fase}
                </p>
                <p
                  className={cn(
                    'text-xs uppercase tracking-wider mt-1 font-medium',
                    isCompleted
                      ? 'text-primary'
                      : isInProgress
                        ? 'text-blue-500'
                        : 'text-muted-foreground',
                  )}
                >
                  {phase.status}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
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

  const formatDate = (dateStr: string) => {
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
                <span className="text-xs text-muted-foreground">{formatDate(comment.created)}</span>
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
