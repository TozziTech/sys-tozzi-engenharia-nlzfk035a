import { useState, useMemo } from 'react'
import { Filter, XCircle } from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DashboardStats } from '@/components/DashboardStats'
import { ProjectTable } from '@/components/ProjectTable'
import { ProjectCardList } from '@/components/ProjectCardList'

export default function Index() {
  const { projects, globalSearch } = useProjectStore()

  const [discipline, setDiscipline] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [client, setClient] = useState<string>('all')

  const uniqueClients = useMemo(
    () => Array.from(new Set(projects.map((p) => p.client))),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.client.toLowerCase().includes(globalSearch.toLowerCase())
      const matchDisc = discipline === 'all' || p.discipline === discipline
      const matchStatus = status === 'all' || p.status === status
      const matchClient = client === 'all' || p.client === client

      return matchSearch && matchDisc && matchStatus && matchClient
    })
  }, [projects, globalSearch, discipline, status, client])

  const clearFilters = () => {
    setDiscipline('all')
    setStatus('all')
    setClient('all')
  }

  const hasActiveFilters = discipline !== 'all' || status !== 'all' || client !== 'all'

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Dashboard de Projetos
        </h1>
        <p className="text-muted-foreground">Acompanhe e gerencie todos os projetos da empresa.</p>
      </div>

      <DashboardStats projects={projects} />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 md:mr-4">
          <Filter className="h-4 w-4" /> Filtros:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto md:flex-1">
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Disciplinas</SelectItem>
              <SelectItem value="Estrutural">Estrutural</SelectItem>
              <SelectItem value="Hidrossanitário">Hidrossanitário</SelectItem>
              <SelectItem value="Elétrico">Elétrico</SelectItem>
              <SelectItem value="Arquitetônico">Arquitetônico</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={client} onValueChange={setClient}>
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Clientes</SelectItem>
              {uniqueClients.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-slate-500 hover:text-slate-900 w-full md:w-auto shrink-0"
          >
            <XCircle className="h-4 w-4 mr-2" /> Limpar
          </Button>
        )}
      </div>

      {/* Content Area */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <img
            src="https://img.usecurling.com/p/300/300?q=empty%20desk&color=gray"
            alt="No projects"
            className="w-64 h-64 object-cover rounded-full mb-6 opacity-80"
          />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground max-w-md">
            Não encontramos nenhum projeto com os filtros aplicados. Tente ajustar sua busca ou crie
            um novo projeto.
          </p>
        </div>
      ) : (
        <>
          <ProjectTable projects={filteredProjects} />
          <ProjectCardList projects={filteredProjects} />
        </>
      )}
    </div>
  )
}
