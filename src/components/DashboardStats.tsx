import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Project } from '@/types/project'

export function DashboardStats({ projects }: { projects: Project[] }) {
  const total = projects.length
  const active = projects.filter(
    (p) => p.status === 'Em Andamento' || p.status === 'Planejamento',
  ).length
  const completed = projects.filter((p) => p.status === 'Concluído').length

  const nearDeadline = projects.filter((p) => {
    if (p.status === 'Concluído') return false
    const end = new Date(p.endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 30
  }).length

  const stats = [
    {
      title: 'Total de Projetos',
      value: total,
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      title: 'Projetos Ativos',
      value: active,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Próximos do Prazo',
      value: nearDeadline,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      title: 'Projetos Concluídos',
      value: completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="border-none shadow-sm animate-fade-in-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
