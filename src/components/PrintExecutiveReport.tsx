import { createPortal } from 'react-dom'
import pb from '@/lib/pocketbase/client'

interface PrintExecutiveReportProps {
  projects: any[]
  companySettings: any
  userName: string
  printMode: 'dashboard' | 'executive' | null
}

export function PrintExecutiveReport({
  projects,
  companySettings,
  userName,
  printMode,
}: PrintExecutiveReportProps) {
  if (printMode !== 'executive') return null

  const generatedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  const activeProjects = projects.filter((p) => p.status !== 'Concluído')
  const completedProjects = projects.filter((p) => p.status === 'Concluído')

  const content = (
    <>
      <style type="text/css">
        {`
          @media print {
            body > :not(#executive-print-root) {
              display: none !important;
            }
            #executive-print-root {
              display: block !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              margin: 1.5cm;
            }
            .page-break-inside-avoid {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      <div
        id="executive-print-root"
        className="hidden print:block w-full bg-white text-black font-sans"
      >
        <div
          className="flex justify-between items-start border-b-4 pb-6 mb-8"
          style={{ borderColor: companySettings?.primary_color || '#1e293b' }}
        >
          <div className="flex items-center gap-6">
            {companySettings?.logo ? (
              <img
                src={pb.files.getURL(companySettings, companySettings.logo)}
                alt="Logo"
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {companySettings?.company_name || 'Empresa'}
              </div>
            )}
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: companySettings?.primary_color || '#0f172a' }}
              >
                Relatório Executivo de Projetos
              </h1>
              <p className="text-slate-600 mt-1 font-medium">Visão Geral e Progresso Consolidado</p>
            </div>
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

        <div className="mb-8 flex gap-4">
          <div className="bg-slate-50 p-4 rounded border flex-1 text-center">
            <p className="text-xs text-slate-500 uppercase font-semibold">Total de Projetos</p>
            <p className="text-2xl font-bold text-slate-800">{projects.length}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border flex-1 text-center">
            <p className="text-xs text-slate-500 uppercase font-semibold">Ativos</p>
            <p className="text-2xl font-bold text-blue-700">{activeProjects.length}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border flex-1 text-center">
            <p className="text-xs text-slate-500 uppercase font-semibold">Concluídos</p>
            <p className="text-2xl font-bold text-emerald-700">{completedProjects.length}</p>
          </div>
        </div>

        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr
              className="border-b-2"
              style={{ borderColor: companySettings?.primary_color || '#e2e8f0' }}
            >
              <th className="py-3 px-4 font-semibold text-slate-800">Nome do Projeto</th>
              <th className="py-3 px-4 font-semibold text-slate-800">Cliente</th>
              <th className="py-3 px-4 font-semibold text-slate-800">Status</th>
              <th className="py-3 px-4 font-semibold text-slate-800">Progresso Geral</th>
              <th className="py-3 px-4 font-semibold text-slate-800">Engenheiro / Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects
              .sort((a, b) => b.progress - a.progress)
              .map((p) => (
                <tr key={p.id} className="page-break-inside-avoid">
                  <td className="py-3 px-4 font-medium text-slate-800">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.client || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold uppercase">
                      {p.status || 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full"
                          style={{
                            width: `${p.progress || 0}%`,
                            backgroundColor: companySettings?.primary_color || '#3b82f6',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">{p.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{p.engineer || '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
