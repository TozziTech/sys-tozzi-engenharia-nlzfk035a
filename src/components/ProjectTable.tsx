import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit2, Eye, Trash2 } from 'lucide-react'
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
import { EditProjectModal } from './EditProjectModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import useProjectStore from '@/stores/useProjectStore'
import { useToast } from '@/hooks/use-toast'

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const { deleteProject } = useProjectStore()
  const { toast } = useToast()

  const handleDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id)
      toast({
        title: 'Projeto excluído',
        description:
          'O projeto foi removido com sucesso. Nota: os dados serão resetados ao recarregar a página (sem backend).',
      })
      setProjectToDelete(null)
    }
  }

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
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                    asChild
                  >
                    <Link to={`/projects/${project.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                    onClick={() => setProjectToEdit(project)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                    onClick={() => setProjectToDelete(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {projectToEdit && (
        <EditProjectModal
          project={projectToEdit}
          open={!!projectToEdit}
          onOpenChange={(open) => !open && setProjectToEdit(null)}
        />
      )}

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto "
              {projectToDelete?.name}" do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
