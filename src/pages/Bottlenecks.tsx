import { useMemo } from 'react'
import { differenceInDays, format, subDays, addDays } from 'date-fns'
import { AlertTriangle, Clock, Users, Activity, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import useProjectStore from '@/stores/useProjectStore'

const TODAY = new Date()

const MOCK_ENGINEERS = [
  { id: 1, name: 'Eng. Ricardo Silva', utilization: 125 },
  { id: 2, name: 'Eng. Ana Costa', utilization: 110 },
  { id: 3, name: 'Eng. Maria Santos', utilization: 95 },
  { id: 4, name: 'Eng. Carlos Oliveira', utilization: 80 },
]

const MOCK_TASKS = [
  {
    id: 1,
    name: 'Aprovação Bombeiros',
    project: 'Hospital São Lucas',
    dueDate: subDays(TODAY, 12),
  },
  { id: 2, name: 'Revisão Estrutural', project: 'Edifício Aurora', dueDate: subDays(TODAY, 5) },
  { id: 3, name: 'Emissão de ART', project: 'Ponte Sul', dueDate: subDays(TODAY, 1) },
  { id: 4, name: 'Orçamento Preliminar', project: 'Shopping Central', dueDate: addDays(TODAY, 2) },
]

const MOCK_DISCIPLINE_DELAYS = [
  { discipline: 'Geotecnia', delay: 15 },
  { discipline: 'Estrutural', delay: 8 },
  { discipline: 'Arquitetura', delay: 3 },
  { discipline: 'Hidrossanitário', delay: 0 },
].sort((a, b) => b.delay - a.delay)

export default function Bottlenecks() {
  const { projects } = useProjectStore()

  const criticalProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.progress >= 50 || p.status === 'Concluído') return false
      const daysToDeadline = differenceInDays(new Date(p.endDate), TODAY)
      return daysToDeadline >= 0 && daysToDeadline <= 7
    })
  }, [projects])

  const overdueTasks = useMemo(() => {
    return MOCK_TASKS.map((t) => ({ ...t, daysOverdue: differenceInDays(TODAY, t.dueDate) }))
      .filter((t) => t.daysOverdue > 0)
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          Gargalos e Riscos
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitore projetos críticos, sobrecarga de equipe e atrasos sistêmicos.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-red-500/50 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Projetos Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto crítico no momento.</p>
            ) : (
              <div className="space-y-4">
                {criticalProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-lg border bg-background p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{p.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          Prazo: {format(new Date(p.endDate), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <Badge variant="destructive">Crítico</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {p.progress}%
                        </span>
                      </div>
                      <Progress
                        value={p.progress}
                        className="h-2 bg-secondary/50 [&>div]:bg-red-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Sobrecarga de Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ENGINEERS.filter((e) => e.utilization >= 90).map((e) => {
                const isCritical = e.utilization > 100
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{e.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-bold',
                        isCritical
                          ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20'
                          : 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20',
                      )}
                    >
                      {e.utilization}% Alocado
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Tarefas Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead className="text-right">Atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.project}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="rounded-full shadow-sm">
                        {t.daysOverdue} {t.daysOverdue === 1 ? 'dia' : 'dias'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Média de Atraso por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MOCK_DISCIPLINE_DELAYS.map((d) => {
                const isRed = d.delay > 5
                const isYellow = d.delay > 0 && d.delay <= 5
                const isNormal = d.delay <= 0

                return (
                  <div
                    key={d.discipline}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-lg border text-center gap-2',
                      isRed &&
                        'bg-red-50/50 border-red-200 dark:bg-red-950/10 dark:border-red-900/50',
                      isYellow &&
                        'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/10 dark:border-yellow-900/50',
                      isNormal && 'bg-secondary/20 border-transparent',
                    )}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {d.discipline}
                    </span>
                    <span
                      className={cn(
                        'text-3xl font-bold tracking-tight',
                        isRed && 'text-red-600 dark:text-red-400',
                        isYellow && 'text-yellow-600 dark:text-yellow-400',
                        isNormal && 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {d.delay > 0 ? `+${d.delay}d` : `${d.delay}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
