import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Project } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { AnimatedProgress } from './AnimatedProgress'
import { CalendarDays, User, Layers } from 'lucide-react'

interface ProjectCardListProps {
  projects: Project[]
}

export function ProjectCardList({ projects }: ProjectCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:hidden animate-fade-in-up">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="overflow-hidden border-slate-200 shadow-sm relative hover:border-slate-300 transition-colors"
        >
          <Link to={`/projects/${project.id}`} className="absolute inset-0 z-10">
            <span className="sr-only">Ver detalhes do projeto {project.name}</span>
          </Link>
          <CardHeader className="pb-3 bg-slate-50/50">
            <div className="flex justify-between items-start gap-4">
              <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                {project.name}
              </CardTitle>
              <StatusBadge status={project.status} />
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Layers className="h-4 w-4 text-slate-400" />
                <span className="truncate">{project.discipline}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                <span className="truncate">{project.client}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  {format(new Date(project.startDate), 'dd/MM/yyyy')} -{' '}
                  {format(new Date(project.endDate), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-700">Progresso</div>
              <AnimatedProgress value={project.progress} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
