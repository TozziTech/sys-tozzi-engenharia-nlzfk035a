import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, FilterX } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { ApaDetailModal } from './ApaDetailModal'

const ALLOWED_ROLES = ['Administrador', 'Gerente de Projeto', 'Projetista']

export type ApaReport = {
  id: string
  created: string
  status: string
  project: string
  positive_points: string
  negative_points: string
  lessons_learned: string
  corrective_plan: string
  expand?: {
    project?: { id: string; name: string }
    created_by?: { name: string }
  }
}

export default function ApaHistory() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ApaReport[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedReport, setSelectedReport] = useState<ApaReport | null>(null)

  useEffect(() => {
    if (!user || !ALLOWED_ROLES.includes(user.role)) return

    Promise.all([
      pb.collection('apa_reports').getFullList({ expand: 'project,created_by', sort: '-created' }),
      pb.collection('projects').getFullList({ sort: 'name' }),
    ]).then(([r, p]) => {
      setReports(r as unknown as ApaReport[])
      setProjects(p.map((proj) => ({ id: proj.id, name: proj.name })))
    })
  }, [user])

  if (!user || !ALLOWED_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />

  const filteredReports = reports.filter((r) => {
    if (selectedProject !== 'all' && r.project !== selectedProject) return false
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false
    if (selectedDate) {
      const rDate = new Date(r.created).toISOString().split('T')[0]
      const sDate = selectedDate.toISOString().split('T')[0]
      if (rDate !== sDate) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione o Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[220px] justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Data da Análise'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluído">Concluído</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            onClick={() => {
              setSelectedProject('all')
              setSelectedStatus('all')
              setSelectedDate(undefined)
            }}
          >
            <FilterX className="h-4 w-4 mr-2" /> Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Data Análise</TableHead>
                <TableHead>Criado Por</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <TableCell className="font-medium">
                    {report.expand?.project?.name || '-'}
                  </TableCell>
                  <TableCell>{format(new Date(report.created), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{report.expand?.created_by?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={report.status === 'concluído' ? 'default' : 'secondary'}
                      className={cn(
                        report.status === 'concluído' && 'bg-green-600 hover:bg-green-700',
                      )}
                    >
                      {report.status === 'concluído' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApaDetailModal
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(op) => !op && setSelectedReport(null)}
      />
    </div>
  )
}
