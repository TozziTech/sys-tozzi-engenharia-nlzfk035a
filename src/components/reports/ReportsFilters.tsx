import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'
import { Project } from '@/types/project'

export type ReportFiltersState = {
  startDate: string
  endDate: string
  discipline: string
  status: string
  engineer: string
}

interface ReportsFiltersProps {
  filters: ReportFiltersState
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersState>>
  projects: Project[]
}

export function ReportsFilters({ filters, setFilters, projects }: ReportsFiltersProps) {
  const disciplines = useMemo(
    () => Array.from(new Set(projects.map((p) => p.discipline))),
    [projects],
  )
  const statuses = useMemo(() => Array.from(new Set(projects.map((p) => p.status))), [projects])
  const engineers = useMemo(() => Array.from(new Set(projects.map((p) => p.engineer))), [projects])

  const updateFilter = (key: keyof ReportFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select value={filters.discipline} onValueChange={(v) => updateFilter('discipline', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {disciplines.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Engenheiro</Label>
            <Select value={filters.engineer} onValueChange={(v) => updateFilter('engineer', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {engineers.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
