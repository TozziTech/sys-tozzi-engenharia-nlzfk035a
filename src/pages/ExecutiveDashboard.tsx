import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Progress } from '@/components/ui/progress'
import { FolderKanban, Layers, CheckCircle2, Activity } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'

export default function ExecutiveDashboard() {
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (user && !canAccess('dashboard_executivo') && user.role !== 'Administrador') {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar o Dashboard Executivo.',
        variant: 'destructive',
      })
      navigate('/dashboard', { replace: true })
    }
  }, [user, canAccess, navigate, toast])

  const [projects, setProjects] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [projs, mods] = await Promise.all([
        pb.collection('projects').getFullList(),
        pb.collection('project_modules').getFullList(),
      ])
      setProjects(projs)
      setModules(mods)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projects', () => loadData())
  useRealtime('project_modules', () => loadData())

  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'Concluído'), [projects])

  const projectProgress = useMemo(() => {
    return activeProjects
      .map((p) => {
        const pModules = modules.filter((m) => m.project === p.id)
        const avgProgress =
          pModules.length > 0
            ? pModules.reduce((acc, m) => acc + (m.progress || 0), 0) / pModules.length
            : 0
        return {
          ...p,
          aggregatedProgress: Math.round(avgProgress),
          moduleCount: pModules.length,
        }
      })
      .sort((a, b) => b.aggregatedProgress - a.aggregatedProgress)
  }, [activeProjects, modules])

  const statusDistribution = useMemo(() => {
    const counts = {
      Pendente: 0,
      'Em Andamento': 0,
      Concluído: 0,
      Pausado: 0,
    }
    modules.forEach((m) => {
      if (m.status in counts) {
        counts[m.status as keyof typeof counts]++
      }
    })

    return [
      { name: 'Pendente', value: counts['Pendente'], fill: 'hsl(var(--muted-foreground))' },
      { name: 'Em Andamento', value: counts['Em Andamento'], fill: 'hsl(var(--primary))' },
      { name: 'Concluído', value: counts['Concluído'], fill: '#10b981' },
      { name: 'Pausado', value: counts['Pausado'], fill: '#f59e0b' },
    ].filter((d) => d.value > 0)
  }, [modules])

  const chartConfig = {
    Pendente: { label: 'Pendente', color: 'hsl(var(--muted-foreground))' },
    'Em Andamento': { label: 'Em Andamento', color: 'hsl(var(--primary))' },
    Concluído: { label: 'Concluído', color: '#10b981' },
    Pausado: { label: 'Pausado', color: '#f59e0b' },
    value: { label: 'Módulos' },
  }

  if (!user || (!canAccess('dashboard_executivo') && user.role !== 'Administrador')) return null

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Executiva</h2>
          <p className="text-muted-foreground mt-1">
            Métricas globais de progresso e saúde de todos os projetos ativos.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '-' : activeProjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Em execução atualmente</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Módulos</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '-' : modules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Disciplinas mapeadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '-' : modules.filter((m) => m.status === 'Concluído').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Entregas realizadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Global de Progresso</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading || activeProjects.length === 0
                ? '-'
                : `${Math.round(
                    projectProgress.reduce((acc, p) => acc + p.aggregatedProgress, 0) /
                      projectProgress.length,
                  )}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média de todos os projetos ativos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mt-4">
        <Card className="col-span-1 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Distribuição de Status (Módulos)</CardTitle>
            <CardDescription>Visão macro da situação das disciplinas.</CardDescription>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum módulo registrado.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-4 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Resumo de Progresso por Projeto</CardTitle>
            <CardDescription>
              Avanço calculado a partir da média de progresso de seus módulos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px] pr-4 space-y-6">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Carregando dados...</div>
            ) : projectProgress.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Nenhum projeto ativo.</div>
            ) : (
              projectProgress.map((p) => (
                <div key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/projects/${p.id}`}
                      className="font-semibold text-sm hover:text-primary transition-colors"
                    >
                      {p.name}
                    </Link>
                    <span className="text-sm font-medium">{p.aggregatedProgress}%</span>
                  </div>
                  <Progress value={p.aggregatedProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{p.moduleCount} módulos vinculados</span>
                    <span>{p.client || 'Sem cliente'}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
