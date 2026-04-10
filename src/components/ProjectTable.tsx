import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit2, Eye } from 'lucide-react'
import { Project } from '@/types/project'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { AnimatedProgress } from './AnimatedProgress'

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden animate-fade-in-up">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-slate-900">Nome do Projeto</TableHead>
            <TableHead className="font-semibold text-slate-900">Disciplina</TableHead>
            <TableHead className="font-semibold text-slate-900">Cliente</TableHead>
            <TableHead className="font-semibold text-slate-900">Início</TableHead>
            <TableHead className="font-semibold text-slate-900">Entrega</TableHead>
            <TableHead className="font-semibold text-slate-900">Status</TableHead>
            <TableHead className="font-semibold text-slate-900 w-[200px]">Progresso</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="group transition-colors">
              <TableCell className="font-medium text-slate-900">{project.name}</TableCell>
              <TableCell className="text-slate-600">{project.discipline}</TableCell>
              <TableCell className="text-slate-600">{project.client}</TableCell>
              <TableCell className="text-slate-600">
                {format(new Date(project.startDate), 'dd MMM yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-slate-600">
                {format(new Date(project.endDate), 'dd MMM yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <StatusBadge status={project.status} />
              </TableCell>
              <TableCell>
                <AnimatedProgress value={project.progress} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
