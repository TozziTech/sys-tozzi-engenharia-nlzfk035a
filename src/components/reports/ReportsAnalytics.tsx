import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { Project } from '@/types/project'
import { cn } from '@/lib/utils'

interface ReportsAnalyticsProps {
  projects: Project[]
  overdueCount: number
}

export function ReportsAnalytics({ projects, overdueCount }: ReportsAnalyticsProps) {
  const { totalTasks, completedTasks, pendingTasks } = useMemo(() => {
    let total = 0
    let completed = 0
    projects.forEach((p) => {
      const pTasks = Math.max(10, Math.floor((p.budget || 0) / 10000))
      total += pTasks
      completed += Math.floor(pTasks * (p.progress / 100))
    })
    return { totalTasks: total, completedTasks: completed, pendingTasks: total - completed }
  }, [projects])

  const { totalEstimated, totalSpent, isOverBudget } = useMemo(() => {
    const est = projects.reduce((acc, p) => acc + (p.budget || 0), 0)
    const spent = projects.reduce((acc, p) => acc + (p.spent || 0), 0)
    return { totalEstimated: est, totalSpent: spent, isOverBudget: spent > est }
  }, [projects])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Resumo Financeiro</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(totalSpent)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            de {formatCurrency(totalEstimated)}
            {isOverBudget ? (
              <Badge variant="destructive" className="ml-auto">
                <TrendingUp className="h-3 w-3 mr-1" /> Acima
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100"
              >
                <TrendingDown className="h-3 w-3 mr-1" /> No Orçamento
              </Badge>
            )}
          </div>
          <Progress
            value={totalEstimated > 0 ? (totalSpent / totalEstimated) * 100 : 0}
            className={cn('mt-4 h-2', isOverBudget && 'bg-red-100 [&>div]:bg-red-600')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Status das Tarefas</CardDescription>
          <CardTitle className="text-2xl">
            {completedTasks}{' '}
            <span className="text-lg text-muted-foreground font-normal">/ {totalTasks}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">{completedTasks} Concluídas</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">{pendingTasks} Pendentes</span>
            </div>
          </div>
          <Progress
            value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
            className="mt-4 h-2 [&>div]:bg-emerald-500"
          />
        </CardContent>
      </Card>

      <Card
        className={cn(
          overdueCount > 0 && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10',
        )}
      >
        <CardHeader className="pb-2">
          <CardDescription className={cn(overdueCount > 0 && 'text-red-600/80 dark:text-red-400')}>
            Projetos em Atraso
          </CardDescription>
          <CardTitle
            className={cn(
              'text-2xl flex items-center gap-2',
              overdueCount > 0 && 'text-red-600 dark:text-red-400',
            )}
          >
            <AlertCircle className="h-6 w-6" /> {overdueCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {overdueCount === 1
              ? '1 projeto ultrapassou'
              : `${overdueCount} projetos ultrapassaram`}{' '}
            a data de entrega.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
