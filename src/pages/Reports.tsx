import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import { ReportsFilters, ReportFiltersState } from '@/components/reports/ReportsFilters'
import { ReportsAnalytics } from '@/components/reports/ReportsAnalytics'
import { ReportsTables } from '@/components/reports/ReportsTables'
import { ProductivityCharts } from '@/components/reports/ProductivityCharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { exportProjectsCSV } from '@/lib/export'

export default function Reports() {
  const { projects } = useProjectStore()

  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: '',
    endDate: '',
    discipline: 'all',
    status: 'all',
    engineer: 'all',
  })

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.startDate && p.startDate < filters.startDate) return false
      if (filters.endDate && p.endDate > filters.endDate) return false
      if (filters.discipline !== 'all' && p.discipline !== filters.discipline) return false
      if (filters.status !== 'all' && p.status !== filters.status) return false
      if (filters.engineer !== 'all' && p.engineer !== filters.engineer) return false
      return true
    })
  }, [projects, filters])

  const overdueProjects = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return filteredProjects.filter((p) => p.endDate < today && p.status !== 'Concluído')
  }, [filteredProjects])

  const { toast } = useToast()

  const handleExportCSV = () => {
    toast({
      title: 'Gerando CSV...',
      description: 'Seu arquivo será baixado em instantes.',
    })

    setTimeout(() => {
      exportProjectsCSV(filteredProjects)
      toast({
        title: 'Exportação Concluída',
        description:
          'Nota: Os dados exportados refletem apenas a sessão atual, pois não há banco de dados conectado.',
      })
    }, 800)
  }

  const handleExportPDF = () => {
    toast({
      title: 'Preparando PDF...',
      description: 'Abrindo visualização de impressão.',
    })

    setTimeout(() => {
      window.print()
      toast({
        title: 'Exportação Concluída',
        description:
          'Nota: Os dados exportados refletem apenas a sessão atual, pois não há banco de dados conectado.',
      })
    }, 800)
  }

  return (
    <div className="w-full mx-auto py-8 px-4 md:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Relatórios
          </h1>
          <p className="text-muted-foreground">Análises, métricas e exportação de dados.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 print:hidden">
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              Exportar como CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4 text-rose-600" />
              Exportar como PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportsFilters filters={filters} setFilters={setFilters} projects={projects} />
      <ReportsAnalytics projects={filteredProjects} overdueCount={overdueProjects.length} />
      <ProductivityCharts projects={filteredProjects} />
      <ReportsTables projects={filteredProjects} overdueProjects={overdueProjects} />

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .w-full { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
