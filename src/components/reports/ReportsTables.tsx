import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Briefcase, CheckCircle2 } from 'lucide-react'
import { Project } from '@/types/project'
import { cn } from '@/lib/utils'

interface ReportsTablesProps {
  projects: Project[]
  overdueProjects: Project[]
}

export function ReportsTables({ projects, overdueProjects }: ReportsTablesProps) {
  const engineerStats = useMemo(() => {
    const map = new Map<string, { allocated: number; used: number }>()
    projects.forEach((p) => {
      if (!map.has(p.engineer)) map.set(p.engineer, { allocated: 0, used: 0 })
      const stats = map.get(p.engineer)!
      stats.allocated += Math.floor((p.budget || 0) / 100)
      stats.used += Math.floor((p.spent || 0) / 100)
    })
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      allocated: stats.allocated,
      used: stats.used,
      utilization: stats.allocated > 0 ? (stats.used / stats.allocated) * 100 : 0,
    }))
  }, [projects])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-slate-500" /> Progresso dos Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[30%]">Progresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum projeto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.client}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === 'Concluído'
                              ? 'default'
                              : p.status === 'Atrasado'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress value={p.progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium w-8">{p.progress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-slate-500" /> Recursos (Horas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engenheiro</TableHead>
                  <TableHead className="text-right">Alocadas</TableHead>
                  <TableHead className="text-right">Utilizadas</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineerStats.map((e) => (
                  <TableRow key={e.name}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-right">{e.allocated}h</TableCell>
                    <TableCell className="text-right">{e.used}h</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-medium',
                          e.utilization > 100
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {e.utilization.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {engineerStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Sem dados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" /> Projetos Atrasados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-red-100 dark:border-red-900/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Data Limite</TableHead>
                  <TableHead>Engenheiro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-50" />
                      Nenhum projeto em atraso.
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueProjects.map((p) => (
                    <TableRow key={p.id} className="bg-red-50/30 dark:bg-red-900/10">
                      <TableCell className="font-medium text-red-700 dark:text-red-300">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {new Date(p.endDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{p.engineer}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
