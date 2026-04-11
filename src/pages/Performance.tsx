import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export default function Performance() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedProject, setSelectedProject] = useState('')
  const [hours, setHours] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])

  const loadData = async () => {
    try {
      const [us, projs, logs] = await Promise.all([
        pb.collection('users').getFullList(),
        pb.collection('projects').getFullList(),
        pb.collection('time_logs').getFullList(),
      ])
      setUsers(us)
      setProjects(projs)
      setTimeLogs(logs)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('time_logs', () => loadData())
  useRealtime('projects', () => loadData())

  const designerStats = useMemo(() => {
    const activeUsers = users.filter(
      (u) =>
        u.role === 'Projetista' ||
        u.role === 'Gerente de Projeto' ||
        u.role === 'Administrador' ||
        timeLogs.some((l) => l.user_id === u.id),
    )

    return activeUsers
      .map((u) => {
        const logsForUser = timeLogs.filter((l) => l.user_id === u.id)
        const totalHours = logsForUser.reduce((sum, l) => sum + (l.hours || 0), 0)

        const completedProjects = projects.filter(
          (p) => p.status === 'Concluído' && (p.engineer === u.name || p.engineer === u.email),
        ).length

        return {
          name: u.name || u.email || 'Desconhecido',
          horas: totalHours,
          projetos: completedProjects,
        }
      })
      .filter((s) => s.horas > 0 || s.projetos > 0)
  }, [users, timeLogs, projects])

  const handleLancarHoras = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !hours || !logDate) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }

    try {
      await pb.collection('time_logs').create({
        user_id: user.id,
        project_id: selectedProject,
        hours: Number(hours),
        date: new Date(logDate).toISOString(),
      })
      toast({ title: 'Horas lançadas com sucesso!' })
      setHours('')
      setSelectedProject('')
    } catch (err) {
      toast({ title: 'Erro ao lançar horas', variant: 'destructive' })
    }
  }

  const chartConfig = {
    horas: { label: 'Total de Horas', color: 'hsl(var(--chart-1))' },
    projetos: { label: 'Projetos Concluídos', color: 'hsl(var(--chart-2))' },
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Performance da Equipe
        </h1>
        <p className="text-muted-foreground">
          Analise as horas trabalhadas e entregas dos projetistas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Lançar Horas</CardTitle>
            <CardDescription>Registre as horas dedicadas aos projetos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLancarHoras} className="space-y-4">
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects
                      .filter((p) => p.status !== 'Concluído')
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Horas (h)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Ex: 4"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Registrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Horas Trabalhadas vs Projetos Concluídos</CardTitle>
            <CardDescription>
              Comparativo por projetista baseado nos registros do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : designerStats.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Nenhum dado encontrado.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={designerStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar
                    yAxisId="left"
                    dataKey="horas"
                    name="Horas Trabalhadas"
                    fill="var(--color-horas)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="projetos"
                    name="Projetos Concluídos"
                    fill="var(--color-projetos)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
