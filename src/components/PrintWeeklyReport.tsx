import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns'

interface PrintWeeklyReportProps {
  projects: any[]
  userName: string
  printMode: 'weekly' | null
}

export function PrintWeeklyReport({ projects, userName, printMode }: PrintWeeklyReportProps) {
  const weeklyProjects = useMemo(() => {
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 0 })
    const end = endOfWeek(now, { weekStartsOn: 0 })

    return projects.filter((p) => {
      // Always include active projects or projects with a deadline in the current week
      if (p.status !== 'Concluído') return true
      if (p.end_date) {
        const endDate = new Date(p.end_date)
        return isWithinInterval(endDate, { start, end })
      }
      return false
    })
  }, [projects])

  if (printMode !== 'weekly') return null

  const generatedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  const content = (
    <>
      <style type="text/css">
        {`
          @media print {
            body > :not(#weekly-print-root) {
              display: none !important;
            }
            #weekly-print-root {
              display: block !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              margin: 1.5cm;
            }
          }
        `}
      </style>
      <div
        id="weekly-print-root"
        className="hidden print:block w-full bg-white text-black font-sans"
      >
        <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatório de Projetos da Semana</h1>
            <p className="text-slate-600 mt-1">
              Semana de {format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'dd/MM/yyyy')} a{' '}
              {format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="text-right text-sm text-slate-600 space-y-1">
            <p>
              <span className="font-semibold">Gerado em:</span> {generatedDate}
            </p>
            <p>
              <span className="font-semibold">Por:</span> {userName}
            </p>
          </div>
        </div>

        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="py-2 px-3 font-semibold text-slate-800 border border-slate-300">
                Projeto
              </th>
              <th className="py-2 px-3 font-semibold text-slate-800 border border-slate-300">
                Cliente
              </th>
              <th className="py-2 px-3 font-semibold text-slate-800 border border-slate-300">
                Status
              </th>
              <th className="py-2 px-3 font-semibold text-slate-800 border border-slate-300 text-center">
                Progresso
              </th>
              <th className="py-2 px-3 font-semibold text-slate-800 border border-slate-300">
                Prazo
              </th>
            </tr>
          </thead>
          <tbody>
            {weeklyProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-slate-500 italic border border-slate-300"
                >
                  Nenhum projeto ativo para esta semana.
                </td>
              </tr>
            ) : (
              weeklyProjects.map((p, i) => (
                <tr key={i} className="break-inside-avoid">
                  <td className="py-2 px-3 font-medium text-slate-800 border border-slate-300">
                    {p.name}
                  </td>
                  <td className="py-2 px-3 text-slate-600 border border-slate-300">
                    {p.client || '-'}
                  </td>
                  <td className="py-2 px-3 text-slate-600 border border-slate-300">{p.status}</td>
                  <td className="py-2 px-3 text-slate-600 border border-slate-300 text-center">
                    {p.progress || 0}%
                  </td>
                  <td className="py-2 px-3 text-slate-600 border border-slate-300">
                    {p.end_date ? format(new Date(p.end_date), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
