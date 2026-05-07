import { useState, useEffect, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Download, AlertCircle, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function LessonsLearnedDashboard() {
  const { user } = useAuth()
  const { settings } = useSettingsStore()
  const { toast } = useToast()

  const [reports, setReports] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [dateFilter, setDateFilter] = useState('6m')
  const [disciplineFilter, setDisciplineFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [reportsData, actionsData, projectsData] = await Promise.all([
          pb.collection('apa_reports').getFullList({ expand: 'project,created_by' }),
          pb.collection('apa_actions').getFullList({ expand: 'apa_report' }),
          pb.collection('projects').getFullList(),
        ])
        setReports(reportsData)
        setActions(actionsData)
        setProjects(projectsData)
      } catch (error) {
        console.error('Error loading APA data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const { disciplines, topProblems, effectivenessData, tableData } = useMemo(() => {
    const now = new Date()
    let limitDate = new Date()
    if (dateFilter === '3m') limitDate.setMonth(now.getMonth() - 3)
    if (dateFilter === '6m') limitDate.setMonth(now.getMonth() - 6)
    if (dateFilter === '1y') limitDate.setFullYear(now.getFullYear() - 1)

    const discs = Array.from(new Set(projects.map((p) => p.discipline).filter(Boolean)))

    const fReports = reports.filter((r) => {
      const created = new Date(r.created)
      if (created < limitDate) return false
      const projDisc = r.expand?.project?.discipline || 'Outros'
      if (disciplineFilter !== 'all' && projDisc !== disciplineFilter) return false
      return true
    })

    const fReportIds = new Set(fReports.map((r) => r.id))
    const fActions = actions.filter((a) => fReportIds.has(a.apa_report))

    const problemsCount: Record<string, number> = {}
    fReports.forEach((r) => {
      const text = r.negative_points || ''
      const points = text
        .split(/[\n,;]+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 4)
      points.forEach((p: string) => {
        const key = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        problemsCount[key] = (problemsCount[key] || 0) + 1
      })
    })

    const topProbs = Object.entries(problemsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name: name.length > 30 ? name.substring(0, 30) + '...' : name,
        count,
      }))

    const completedActions = fActions.filter((a) => a.status === 'concluída')
    let onTime = 0
    let late = 0

    completedActions.forEach((a) => {
      const updated = new Date(a.updated)
      const due = a.due_date ? new Date(a.due_date) : null
      if (updated && due) {
        updated.setHours(0, 0, 0, 0)
        due.setHours(0, 0, 0, 0)
        if (updated <= due) onTime++
        else late++
      } else {
        onTime++
      }
    })

    const effData = [
      { name: 'No Prazo', value: onTime, color: '#10b981' },
      { name: 'Atrasada', value: late, color: '#ef4444' },
    ]

    const discStats: Record<
      string,
      {
        apas: number
        problems: number
        projects: Set<string>
        actionsOnTime: number
        actionsTotal: number
      }
    > = {}

    fReports.forEach((r) => {
      const disc = r.expand?.project?.discipline || 'Outros'
      if (!discStats[disc]) {
        discStats[disc] = {
          apas: 0,
          problems: 0,
          projects: new Set(),
          actionsOnTime: 0,
          actionsTotal: 0,
        }
      }
      discStats[disc].apas++
      if (r.project) discStats[disc].projects.add(r.project)

      const points = (r.negative_points || '')
        .split(/[\n,;]+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 4)
      discStats[disc].problems += points.length
    })

    fActions.forEach((a) => {
      if (a.status !== 'concluída') return
      const rep = reports.find((r) => r.id === a.apa_report)
      if (!rep) return
      const disc = rep.expand?.project?.discipline || 'Outros'
      if (discStats[disc]) {
        discStats[disc].actionsTotal++
        const updated = new Date(a.updated)
        const due = a.due_date ? new Date(a.due_date) : null
        if (updated && due) {
          updated.setHours(0, 0, 0, 0)
          due.setHours(0, 0, 0, 0)
          if (updated <= due) discStats[disc].actionsOnTime++
        } else {
          discStats[disc].actionsOnTime++
        }
      }
    })

    const tData = Object.entries(discStats)
      .map(([disc, stats]) => {
        const avgProblems =
          stats.projects.size > 0 ? (stats.problems / stats.projects.size).toFixed(1) : 0
        const effectRate =
          stats.actionsTotal > 0 ? ((stats.actionsOnTime / stats.actionsTotal) * 100).toFixed(1) : 0
        return {
          discipline: disc,
          totalApas: stats.apas,
          avgProblems: Number(avgProblems),
          effectiveness: Number(effectRate),
        }
      })
      .sort((a, b) => b.totalApas - a.totalApas)

    return {
      disciplines: discs,
      topProblems: topProbs,
      effectivenessData: effData,
      tableData: tData,
    }
  }, [reports, actions, projects, dateFilter, disciplineFilter])

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const now = new Date()

      let csvContent = 'Relatório de Lições Aprendidas (APA)\n\n'
      csvContent += `Período de filtro,${dateFilter}\n`
      csvContent += `Filtro de Disciplina,${disciplineFilter !== 'all' ? disciplineFilter : 'Todas'}\n\n`

      csvContent += 'Top Problemas Recorrentes\n'
      csvContent += 'Problema,Ocorrências\n'
      if (topProblems.length === 0) {
        csvContent += 'Nenhum problema registrado no período.,0\n'
      } else {
        topProblems.forEach((p) => {
          csvContent += `"${p.name.replace(/"/g, '""')}",${p.count}\n`
        })
      }
      csvContent += '\n'

      csvContent += 'Efetividade de Ações\n'
      csvContent += 'Status,Quantidade\n'
      csvContent += `No Prazo,${effectivenessData[0].value}\n`
      csvContent += `Atrasadas,${effectivenessData[1].value}\n\n`

      csvContent += 'Comparativo por Disciplina\n'
      csvContent += 'Disciplina,APAs,Problemas/Projeto (Média),Efetividade (%)\n'
      if (tableData.length === 0) {
        csvContent += 'Nenhum dado disponível.,0,0,0\n'
      } else {
        tableData.forEach((row) => {
          csvContent += `"${row.discipline.replace(/"/g, '""')}",${row.totalApas},${row.avgProblems},${row.effectiveness}\n`
        })
      }

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio_apa_${now.getTime()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: 'Sucesso', description: 'Relatório exportado com sucesso.' })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: getErrorMessage(error) || 'Erro ao exportar relatório',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const barChartConfig = {
    count: { label: 'Ocorrências', color: 'hsl(var(--primary))' },
  }

  const pieChartConfig = {
    onTime: { label: 'No Prazo', color: '#10b981' },
    late: { label: 'Atrasada', color: '#ef4444' },
  }

  if (user?.role === 'Visitante' || user?.role === 'Cliente') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise Pós-Ação (APA)</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard de Lições Aprendidas e melhoria contínua.
          </p>
        </div>
        <Button asChild>
          <Link to="/apa/new">
            <Plus className="mr-2 h-4 w-4" /> Nova APA
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-[200px]">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 Meses</SelectItem>
                <SelectItem value="6m">Últimos 6 Meses</SelectItem>
                <SelectItem value="1y">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-[250px]">
            <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Disciplinas</SelectItem>
                {disciplines.map((d) => (
                  <SelectItem key={d} value={d as string}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="w-full sm:w-auto"
          disabled={loading || isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar Relatório
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando dados...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Recorrência de Problemas</CardTitle>
                <CardDescription>Top 5 problemas mais relatados no período.</CardDescription>
              </CardHeader>
              <CardContent>
                {topProblems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhum problema registrado no período.</p>
                  </div>
                ) : (
                  <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                    <BarChart data={topProblems} layout="vertical" margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={160}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Efetividade de Ações</CardTitle>
                <CardDescription>
                  Percentual de ações corretivas concluídas no prazo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {effectivenessData[0].value === 0 && effectivenessData[1].value === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhuma ação concluída no período.</p>
                  </div>
                ) : (
                  <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={effectivenessData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                      >
                        {effectivenessData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>3. Comparativo por Disciplina</CardTitle>
              <CardDescription>
                Resumo de problemas e taxa de ações concluídas no prazo por especialidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tableData.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhum dado disponível para o filtro selecionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Disciplina</th>
                        <th className="px-4 py-3 text-center font-semibold">Total APAs</th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Problemas (Média/Proj)
                        </th>
                        <th className="px-4 py-3 font-semibold">Taxa de Efetividade (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tableData.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/30 transition-colors border-b border-border last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">{row.discipline}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {row.totalApas}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {row.avgProblems}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="w-10 font-medium text-right">
                                {row.effectiveness}%
                              </span>
                              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${row.effectiveness > 70 ? 'bg-emerald-500' : row.effectiveness > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${row.effectiveness}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
