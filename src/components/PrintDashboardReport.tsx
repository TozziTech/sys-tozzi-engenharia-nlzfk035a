import { useMemo } from 'react'
import { createPortal } from 'react-dom'

interface PrintDashboardReportProps {
  projects: any[]
  financials: any[]
  bottlenecks: any[]
  userName: string
}

export function PrintDashboardReport({
  projects,
  financials,
  bottlenecks,
  userName,
}: PrintDashboardReportProps) {
  const { receitas, despesas, saldo } = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthFinancials = financials.filter((f) => {
      const d = new Date(f.date || f.created)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    let rec = 0
    let des = 0

    monthFinancials.forEach((f) => {
      const type = (f.type || '').toLowerCase()
      const isExpense = type.includes('saída') || type.includes('despesa') || f.amount < 0

      if (isExpense) des += Math.abs(f.amount)
      else rec += f.amount
    })

    return { receitas: rec, despesas: des, saldo: rec - des }
  }, [financials])

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(),
  )
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
            body > :not(#dashboard-print-root) {
              display: none !important;
            }
            #dashboard-print-root {
              display: block !important;
            }
            @page {
              margin: 1.5cm;
            }
          }
        `}
      </style>
      <div
        id="dashboard-print-root"
        className="hidden print:block w-full bg-white text-black font-sans"
      >
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Relatório de Gestão</h1>
            <p className="text-slate-600 mt-1 capitalize">{monthName}</p>
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

        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-slate-800 border-b border-slate-200 pb-2">
            Resumo Financeiro (Mês Atual)
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">Receitas</p>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">Saldo</p>
              <p
                className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800 border-b border-slate-200 pb-2">
            Gargalos Críticos e Alertas
          </h2>
          {bottlenecks.length === 0 ? (
            <p className="text-slate-600 italic">Nenhum gargalo crítico detectado no momento.</p>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="py-3 px-4 font-semibold text-slate-800 border border-slate-200">
                    Projeto
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-800 border border-slate-200">
                    Problema
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-800 border border-slate-200">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.map((b, i) => (
                  <tr key={i} className="break-inside-avoid">
                    <td className="py-3 px-4 font-medium text-slate-800 border border-slate-200">
                      {b.project.name}
                    </td>
                    <td className="py-3 px-4 text-red-600 font-medium border border-slate-200">
                      {b.message}
                    </td>
                    <td className="py-3 px-4 text-slate-600 border border-slate-200">
                      {b.project.progress}% concluído
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
