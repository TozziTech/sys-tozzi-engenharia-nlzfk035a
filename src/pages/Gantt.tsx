import { useState, useMemo } from 'react'
import {
  format,
  parseISO,
  differenceInDays,
  min,
  max,
  addDays,
  subDays,
  eachDayOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Project, Status } from '@/types/project'
import { cn } from '@/lib/utils'
import { CalendarDays, Download, AlertTriangle } from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import { EditProjectModal } from '@/components/EditProjectModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

const today = new Date()

type Zoom = 'week' | 'month' | 'quarter'
const ZOOM_WIDTHS: Record<Zoom, number> = { week: 32, month: 12, quarter: 4 }

export default function Gantt() {
  const { projects } = useProjectStore()
  const { toast } = useToast()

  const [zoom, setZoom] = useState<Zoom>('week')
  const [disc, setDisc] = useState<string>('all')
  const [stat, setStat] = useState<string>('all')
  const [eng, setEng] = useState<string>('all')

  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const filtered = useMemo(() => {
    return projects.filter(
      (p) =>
        (disc === 'all' || p.discipline === disc) &&
        (stat === 'all' || p.status === stat) &&
        (eng === 'all' || p.engineer === eng),
    )
  }, [projects, disc, stat, eng])

  const { allDays, months, chartStart } = useMemo(() => {
    const dates = filtered.flatMap((p) => {
      try {
        return [parseISO(p.startDate), parseISO(p.endDate)]
      } catch (e) {
        return []
      }
    })
    const minD = dates.length ? min(dates) : today
    const maxD = dates.length ? max(dates) : addDays(today, 30)

    const start = subDays(minD, 14)
    const end = addDays(maxD, 28)
    const days = eachDayOfInterval({ start, end })

    const mths: { name: string; days: number }[] = []
    let curM = '',
      cnt = 0
    days.forEach((d) => {
      const m = format(d, 'MMMM yyyy', { locale: ptBR })
      if (m !== curM) {
        if (curM) mths.push({ name: curM, days: cnt })
        curM = m
        cnt = 1
      } else cnt++
    })
    if (curM) mths.push({ name: curM, days: cnt })

    return { allDays: days, months: mths, chartStart: start }
  }, [filtered])

  const dw = ZOOM_WIDTHS[zoom]
  const totalWidth = allDays.length * dw

  const getStatusColor = (s: Status) => {
    if (s === 'Em Andamento') return 'bg-blue-500'
    if (s === 'Concluído') return 'bg-emerald-500'
    if (s === 'Atrasado') return 'bg-red-500'
    return 'bg-slate-400'
  }

  const exportToPDF = () => {
    window.print()
  }

  const exportToImage = () => {
    toast({
      title: 'Exportação Simulada',
      description:
        'A exportação para imagem requer conexão com backend. Use a opção PDF temporariamente.',
    })
  }

  const handleProjectClick = (p: Project) => {
    setSelectedProject(p)
    setIsEditModalOpen(true)
  }

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #gantt-export-area, #gantt-export-area * {
            visibility: visible;
          }
          #gantt-export-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: auto !important;
            overflow: visible !important;
            background: white;
            z-index: 9999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="gantt-export-area"
        className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 gap-6 w-full max-w-full overflow-hidden"
      >
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex items-center gap-2 no-print">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Dados e exportação temporários. Conecte um backend (Skip Cloud/Supabase) para
            persistência e relatórios avançados.
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-8 w-8 text-primary" />
              Cronograma de Projetos
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie as linhas do tempo dos projetos de forma gráfica.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/50 p-1 rounded-lg border">
              <Button
                size="sm"
                variant={zoom === 'week' ? 'default' : 'ghost'}
                onClick={() => setZoom('week')}
              >
                Semana
              </Button>
              <Button
                size="sm"
                variant={zoom === 'month' ? 'default' : 'ghost'}
                onClick={() => setZoom('month')}
              >
                Mês
              </Button>
              <Button
                size="sm"
                variant={zoom === 'quarter' ? 'default' : 'ghost'}
                onClick={() => setZoom('quarter')}
              >
                Trimestre
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="ml-2 gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToPDF}>Exportar como PDF (Print)</DropdownMenuItem>
                <DropdownMenuItem onClick={exportToImage}>Exportar como Imagem</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border shadow-sm no-print">
          <Select value={disc} onValueChange={setDisc}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Disciplinas</SelectItem>
              {Array.from(new Set(projects.map((p) => p.discipline)))
                .filter(Boolean)
                .map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={stat} onValueChange={setStat}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Array.from(new Set(projects.map((p) => p.status)))
                .filter(Boolean)
                .map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={eng} onValueChange={setEng}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Engenheiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Engenheiros</SelectItem>
              {Array.from(new Set(projects.map((p) => p.engineer)))
                .filter(Boolean)
                .map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 border rounded-xl bg-card shadow-sm overflow-auto relative z-0 min-h-0">
          <div className="flex min-w-max w-full">
            {/* Left sticky column */}
            <div className="w-72 flex-shrink-0 sticky left-0 z-30 bg-card border-r shadow-[4px_0_12px_rgba(0,0,0,0.03)]">
              <div className="h-14 border-b flex items-center px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider sticky top-0 bg-card z-40">
                Projeto / Engenheiro
              </div>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="h-14 border-b flex flex-col justify-center px-4 bg-card group hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleProjectClick(p)}
                >
                  <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {p.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{p.engineer}</span>
                </div>
              ))}
            </div>

            {/* Timeline area */}
            <div className="relative flex-1" style={{ width: totalWidth, minWidth: totalWidth }}>
              {/* Header */}
              <div className="h-14 border-b flex sticky top-0 z-20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                {months.map((m) => (
                  <div
                    key={m.name}
                    className="border-r flex items-center px-3 text-xs font-semibold text-muted-foreground capitalize overflow-hidden"
                    style={{ width: m.days * dw }}
                  >
                    <span className="truncate">{m.name}</span>
                  </div>
                ))}
              </div>

              {/* Grid Background */}
              <div
                className="absolute inset-0 top-14 pointer-events-none opacity-15"
                style={{
                  backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px)`,
                  backgroundSize: `${dw}px 100%`,
                }}
              />

              {/* Flow rows */}
              <div className="flex flex-col w-full relative">
                {filtered.map((p) => {
                  let sDay = 0
                  let dur = 8
                  try {
                    sDay = differenceInDays(parseISO(p.startDate), chartStart)
                    dur = differenceInDays(parseISO(p.endDate), parseISO(p.startDate)) + 1
                  } catch (e) {
                    // fallback values
                  }

                  return (
                    <div
                      key={p.id}
                      className="h-14 border-b border-border/50 w-full relative flex items-center hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={cn(
                          'absolute h-8 rounded-md shadow-sm overflow-hidden transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer hover:brightness-110',
                          getStatusColor(p.status),
                        )}
                        style={{ left: sDay * dw, width: Math.max(dur * dw, 8) }}
                        title={`Clique para editar: ${p.name} - ${p.status} - ${p.progress}%`}
                        onClick={() => handleProjectClick(p)}
                      >
                        <div className="h-full bg-black/20" style={{ width: `${p.progress}%` }} />
                        {dur * dw > 60 && (
                          <div className="absolute inset-0 flex items-center px-3 text-[11px] text-white font-medium truncate drop-shadow-md">
                            {p.progress}%
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedProject && (
        <EditProjectModal
          project={selectedProject}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </>
  )
}
