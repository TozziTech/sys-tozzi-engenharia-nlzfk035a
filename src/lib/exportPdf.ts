import { User, Project } from '@/types/project'

import { format } from 'date-fns'

const getPrimaryColor = (settings: any) => settings?.primary_color || '#1f2937'

export function exportPremiumExecutivePDF(
  project: any,
  modules: any[],
  finance: { totalIn: number; totalOut: number; pendingOut: number },
  currentUser: string,
  settings: any = null,
  options?: {
    overview?: boolean
    financial?: boolean
    schedule?: boolean
    team?: boolean
    teamMembers?: any[]
  },
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const progress = project.progress || 0
  const budget = project.budget || 0
  const totalModules = modules.length
  const completedModules = modules.filter((m) => m.status === 'Concluído').length

  const opts = options || { overview: true, financial: true, schedule: true, team: false }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Executivo Premium - ${project.name}</title>
        <style>
          @page { margin: 15mm; size: A4; }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0; 
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 25px;
            border-bottom: 3px solid ${primaryColor};
            margin-bottom: 30px;
          }
          .header-left { display: flex; align-items: center; gap: 20px; }
          .header-logo { max-height: 70px; object-fit: contain; }
          .header-title { margin: 0; font-size: 28px; color: #111827; font-weight: 800; letter-spacing: -0.5px; }
          .header-subtitle { margin: 4px 0 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }
          .header-meta { text-align: right; font-size: 12px; color: #6b7280; }
          .header-meta strong { color: #374151; }

          .grid-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-bottom: 30px; }
          .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }

          .card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 30px;
          }
          .card-title {
            font-size: 14px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .card-title::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${primaryColor};
          }

          .kpi-box {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            border: 1px solid #f1f5f9;
          }
          .kpi-value { font-size: 24px; font-weight: 800; color: ${primaryColor}; margin-bottom: 4px; }
          .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }

          .donut-container { display: flex; align-items: center; justify-content: center; gap: 20px; }
          .donut-info { text-align: center; }
          .donut-info h4 { margin: 0; font-size: 32px; color: #1e293b; line-height: 1; }
          .donut-info p { margin: 5px 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }

          .progress-bar-wrap { width: 100%; background: #e2e8f0; border-radius: 99px; height: 8px; overflow: hidden; margin-top: 8px; }
          .progress-bar-fill { height: 100%; background: ${primaryColor}; border-radius: 99px; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          th { font-weight: 700; color: #475569; background: #f8fafc; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          tr:last-child td { border-bottom: none; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }

          @media print {
            body { background: #fff; padding: 0; margin: 0; }
            .container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 12px; text-align: center; margin-bottom: 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          A impressão iniciará automaticamente. Para melhor qualidade, marque "Gráficos de plano de fundo".
        </div>

        <div class="container">
          <div class="header">
            <div class="header-left">
              ${logoUrl ? `<img src="${logoUrl}" class="header-logo" />` : ''}
              <div>
                <h1 class="header-title">${project.name}</h1>
                <p class="header-subtitle">Relatório Executivo de Projeto</p>
              </div>
            </div>
            <div class="header-meta">
              <p style="margin: 0 0 4px;"><strong>Gerado por:</strong> ${currentUser}</p>
              <p style="margin: 0 0 4px;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
              <p style="margin: 0;"><strong>Cliente:</strong> ${project.client || 'N/A'}</p>
            </div>
          </div>

          ${
            !options || options.overview
              ? `
          <div class="grid-2">
            <div class="card">
              <div class="card-title">Resumo do Progresso</div>
              <div class="donut-container">
                <svg width="120" height="120" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${primaryColor}" stroke-width="3.5" stroke-dasharray="${progress}, 100" stroke-linecap="round" />
                  <text x="18" y="20.5" font-size="8" font-weight="bold" fill="#1e293b" text-anchor="middle">${progress}%</text>
                </svg>
                <div class="donut-info">
                  <h4>${completedModules}/${totalModules}</h4>
                  <p>Módulos Concluídos</p>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Informações Gerais</div>
              <div style="font-size: 13px; color: #475569; line-height: 2;">
                <div><strong>Engenheiro Resp.:</strong> ${project.engineer || 'N/A'}</div>
                <div><strong>Disciplina Principal:</strong> ${project.discipline || 'N/A'}</div>
                <div><strong>Data Início:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                <div><strong>Previsão Término:</strong> ${project.endDate ? new Date(project.endDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                <div><strong>Status:</strong> <span style="color: ${primaryColor}; font-weight: 600;">${project.status}</span></div>
              </div>
            </div>
          </div>
          `
              : ''
          }

          ${
            !options || options.financial
              ? `
          <div class="grid-4">
            <div class="kpi-box">
              <div class="kpi-value">${formatCurrency(budget)}</div>
              <div class="kpi-label">Orçamento Previsto</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-value" style="color: #dc2626;">${formatCurrency(finance.totalOut)}</div>
              <div class="kpi-label">Custo Realizado</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-value" style="color: #059669;">${formatCurrency(finance.totalIn)}</div>
              <div class="kpi-label">Faturamento</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-value" style="color: ${finance.totalIn - finance.totalOut >= 0 ? '#059669' : '#dc2626'};">${formatCurrency(finance.totalIn - finance.totalOut)}</div>
              <div class="kpi-label">Resultado Líquido</div>
            </div>
          </div>
          `
              : ''
          }

          ${
            !options || options.schedule
              ? `
          <div class="card" style="margin-bottom: 30px;">
            <div class="card-title">Situação das Disciplinas (Top 10)</div>
            <table>
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th>Status</th>
                  <th>Prazo</th>
                  <th style="width: 30%;">Progresso</th>
                </tr>
              </thead>
              <tbody>
                ${modules
                  .slice(0, 10)
                  .map((m) => {
                    let bg = '#f1f5f9',
                      color = '#475569'
                    if (m.status === 'Concluído') {
                      bg = '#dcfce7'
                      color = '#059669'
                    } else if (m.status === 'Em Andamento') {
                      bg = '#dbeafe'
                      color = '#2563eb'
                    } else if (m.status === 'Pausado') {
                      bg = '#fef3c7'
                      color = '#d97706'
                    }

                    return `
                    <tr>
                      <td style="font-weight: 600; color: #1e293b;">${m.name}</td>
                      <td><span class="status-badge" style="background: ${bg}; color: ${color};">${m.status}</span></td>
                      <td>${m.deadline ? new Date(m.deadline).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600; margin-bottom: 4px;">
                          <span>${m.progress || 0}%</span>
                        </div>
                        <div class="progress-bar-wrap">
                          <div class="progress-bar-fill" style="width: ${m.progress || 0}%;"></div>
                        </div>
                      </td>
                    </tr>
                  `
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
          `
              : ''
          }

          ${
            options?.team && options.teamMembers && options.teamMembers.length > 0
              ? `
          <div class="card" style="margin-bottom: 30px;">
            <div class="card-title">Equipe do Projeto</div>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Função</th>
                </tr>
              </thead>
              <tbody>
                ${options.teamMembers
                  .map(
                    (member) => `
                  <tr>
                    <td style="font-weight: 600; color: #1e293b;">${member.name || '-'}</td>
                    <td>${member.email || '-'}</td>
                    <td>${member.role || '-'}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          `
              : ''
          }

          <div class="footer">
            Este relatório contém informações confidenciais do projeto e é destinado apenas para uso executivo.<br>
            Sistema de Gestão Integrada &bull; ${new Date().getFullYear()}
          </div>
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 500)
}

export function exportClientDashboardPDF(
  user: any,
  projects: any[],
  phases: any[],
  payments: any[],
  comments: any[],
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings) || '#D4AF37'
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progresso_total || 0), 0) / projects.length)
      : 0

  const phaseStats = phases.reduce(
    (acc, p) => {
      const st = p.status || 'Pendente'
      acc[st] = (acc[st] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const totalPago = payments
    .filter((p) => p.status === 'Pago')
    .reduce((sum, p) => sum + (p.valor || 0), 0)
  const totalPendente = payments
    .filter((p) => p.status === 'Pendente' || p.status === 'Atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0)

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório do Painel do Cliente</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #27272a; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
            background: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #18181b; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #52525b; font-size: 14px; }
          
          .summary-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            padding: 15px;
            border-radius: 8px;
            flex: 1;
            border-top: 4px solid ${primaryColor};
          }
          .summary-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #52525b; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 24px; font-weight: bold; color: #18181b; }
          
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; color: ${primaryColor}; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; margin-bottom: 15px; font-weight: bold; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
          th { background-color: #fafafa; color: #3f3f46; font-size: 12px; text-transform: uppercase; font-weight: 600; }
          
          .comment { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f4f4f5; }
          .comment-header { font-size: 12px; color: #52525b; margin-bottom: 4px; }
          .comment-header strong { color: #18181b; font-size: 14px; }
          .comment-body { font-size: 14px; color: #3f3f46; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Relatório de Status do Projeto</h1>
          <p><strong>Cliente:</strong> ${user?.name || 'N/A'}</p>
          <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Progresso Médio</h3>
            <p>${avgProgress}%</p>
          </div>
          <div class="summary-card">
            <h3>Total Pago</h3>
            <p style="color: #059669;">${formatCurrency(totalPago)}</p>
          </div>
          <div class="summary-card">
            <h3>Pendente / Atrasado</h3>
            <p style="color: #dc2626;">${formatCurrency(totalPendente)}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Status dos Projetos</div>
          ${
            projects.length === 0
              ? '<p style="color: #52525b;">Nenhum projeto ativo.</p>'
              : `
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Início</th>
                <th>Progresso</th>
                <th>Status Geral</th>
              </tr>
            </thead>
            <tbody>
              ${projects
                .map(
                  (p) => `
                <tr>
                  <td style="font-weight: 500;">${p.nome_projeto}</td>
                  <td>${p.data_inicio ? new Date(p.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>${p.progresso_total || 0}%</td>
                  <td>${p.status_geral}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          `
          }
        </div>

        <div class="section">
          <div class="section-title">Resumo de Fases</div>
          <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            ${Object.entries(phaseStats)
              .map(
                ([status, count]) => `
              <div style="background: #f4f4f5; padding: 8px 15px; border-radius: 4px; font-size: 14px;">
                <strong>${status}:</strong> ${count}
              </div>
            `,
              )
              .join('')}
          </div>
          ${Object.keys(phaseStats).length === 0 ? '<p style="color: #52525b;">Nenhuma fase registrada.</p>' : ''}
        </div>

        <div class="section">
          <div class="section-title">Atividades Recentes</div>
          ${
            comments.length === 0
              ? '<p style="color: #52525b;">Nenhuma atividade recente.</p>'
              : comments
                  .slice(0, 10)
                  .map(
                    (c) => `
            <div class="comment">
              <div class="comment-header">
                <strong>${c.expand?.autor?.name || 'Equipe'}</strong> em ${new Date(c.created).toLocaleString('pt-BR')}
                ${c.expand?.projeto_id?.nome_projeto ? ` &bull; <em>Projeto: ${c.expand.projeto_id.nome_projeto}</em>` : ''}
              </div>
              <div class="comment-body">
                ${c.mensagem}
              </div>
            </div>
          `,
                  )
                  .join('')
          }
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportSpecialtiesPDF(
  project: any,
  groupedStats: { groupName: string; stats: any[] }[],
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Especialidades - ${project.name}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #1a1a1a; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .group-title {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            margin: 30px 0 10px 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            page-break-after: avoid;
          }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            vertical-align: middle;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; }
          
          .progress-bg { background-color: #e5e7eb; border-radius: 4px; width: 100%; height: 8px; overflow: hidden; margin-top: 4px; }
          .progress-bar { background-color: ${primaryColor}; height: 100%; }
          
          .status-grid { display: flex; gap: 8px; font-size: 11px; flex-wrap: wrap; margin-top: 4px; }
          .status-item { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #4b5563; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .group-container { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Relatório de Especialidades</h1>
          <p><strong>Projeto:</strong> ${project.name} &bull; <strong>Cliente:</strong> ${project.client}</p>
          <p>Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        ${groupedStats
          .map((group) => {
            if (group.stats.length === 0) return ''
            return `
            <div class="group-container">
              ${groupedStats.length > 1 || group.groupName !== 'Todos os Módulos' ? `<div class="group-title">${group.groupName}</div>` : ''}
              <table>
                <thead>
                  <tr>
                    <th>Especialidade</th>
                    <th style="width: 100px;">Módulos</th>
                    <th style="width: 200px;">Status dos Módulos</th>
                    <th style="width: 150px; text-align: right;">Progresso Médio</th>
                  </tr>
                </thead>
                <tbody>
                  ${group.stats
                    .map(
                      (stat: any) => `
                      <tr>
                        <td>
                          <div style="font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px;">
                            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${stat.color};"></span>
                            ${stat.name} ${stat.is_emphasized ? '<span style="color: #eab308; font-size: 16px;">★</span>' : ''}
                          </div>
                        </td>
                        <td>${stat.count}</td>
                        <td>
                          <div class="status-grid">
                            ${Object.entries(stat.statuses)
                              .map(
                                ([status, count]) =>
                                  `<div class="status-item">${status}: ${count}</div>`,
                              )
                              .join('')}
                          </div>
                        </td>
                        <td style="text-align: right;">
                          <div style="font-weight: 700; color: ${primaryColor};">${stat.averageProgress}%</div>
                          <div class="progress-bg">
                            <div class="progress-bar" style="width: ${stat.averageProgress}%;"></div>
                          </div>
                        </td>
                      </tr>
                    `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          })
          .join('')}
        
        ${groupedStats.every((g) => g.stats.length === 0) ? '<p style="text-align: center; color: #6b7280; padding: 40px;">Nenhuma especialidade encontrada para os filtros atuais.</p>' : ''}
        
        <div class="footer">
          Documento gerado pelo Sistema de Gerenciamento de Projetos.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportTeamPDF(members: any[], currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório da Equipe</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">${settings?.company_name || 'Relatório da Equipe'}</h2>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Cargo</th>
              <th>Telefone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${members
              .map(
                (m) => `
              <tr>
                <td>${m.codigo || '-'}</td>
                <td>${m.name || '-'}</td>
                <td>${m.email || '-'}</td>
                <td>${m.role || '-'}</td>
                <td>${m.phone || '-'}</td>
                <td>${m.status || '-'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportProjectProgressPDF(
  project: any,
  phases: any[],
  payments: any[],
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const totalPaid = payments.filter((p) => p.status === 'Pago').reduce((acc, p) => acc + p.valor, 0)
  const totalPending = payments
    .filter((p) => p.status !== 'Pago')
    .reduce((acc, p) => acc + p.valor, 0)

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Progresso - ${project.nome_projeto}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #1a1a1a; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #111827; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .summary {
            display: flex;
            justify-content: space-around;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
            margin-bottom: 30px;
          }
          .summary-item { text-align: center; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .summary-value { font-size: 20px; font-weight: 700; color: #111827; margin-top: 5px; }
          
          .section-title { font-size: 18px; color: ${primaryColor}; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-weight: bold; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            vertical-align: top;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Relatório de Progresso do Projeto</h1>
          <p><strong>Projeto:</strong> ${project.nome_projeto}</p>
          <p>Gerado por: ${currentUser} em ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div class="section-title">Resumo Executivo</div>
          <p><strong>Escopo:</strong> ${project.descricao_escopo || 'N/A'}</p>
          <p><strong>Status Geral:</strong> ${project.status_geral || 'N/A'}</p>
          <p><strong>Início:</strong> ${formatDate(project.data_inicio)} &bull; <strong>Previsão de Entrega:</strong> ${formatDate(project.data_previsao_entrega)}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Progresso Total</div>
            <div class="summary-value">${project.progresso_total || 0}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Pago</div>
            <div class="summary-value" style="color: #059669;">${formatCurrency(totalPaid)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Pendente</div>
            <div class="summary-value" style="color: #d97706;">${formatCurrency(totalPending)}</div>
          </div>
        </div>

        <div class="section-title">Cronograma e Fases</div>
        <table>
          <thead>
            <tr>
              <th>Fase</th>
              <th>Status</th>
              <th>Progresso</th>
              <th>Conclusão Estimada</th>
            </tr>
          </thead>
          <tbody>
            ${phases
              .map(
                (p) => `
                <tr>
                  <td style="font-weight: 500;">${p.nome_fase}</td>
                  <td>${p.status}</td>
                  <td>${p.progresso || 0}%</td>
                  <td>${formatDate(p.data_conclusao_estimada)}</td>
                </tr>
              `,
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="section-title">Resumo Financeiro</div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .map(
                (p) => `
                <tr>
                  <td>${p.descricao}</td>
                  <td>${formatDate(p.data_vencimento)}</td>
                  <td>${p.status}</td>
                  <td style="text-align: right;">${formatCurrency(p.valor)}</td>
                </tr>
              `,
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Documento gerado pelo Sistema de Gerenciamento de Projetos.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportContractPDF(contract: any, currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const rawContent = contract.final_content || ''
  const content =
    rawContent.includes('<') && rawContent.includes('>')
      ? rawContent
      : rawContent.replace(/\n/g, '<br/>')
  const fileName = `Contrato_${(contract.client_name || 'Cliente').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: "Times New Roman", Times, serif; 
            line-height: 1.6; 
            color: #000; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 20px;
            font-size: 12pt;
          }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
          .header img { max-height: 80px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-family: system-ui, sans-serif; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente. Escolha "Salvar como PDF" como destino.
        </div>
        ${logoUrl ? `<div class="header"><img src="${logoUrl}" /></div>` : ''}
        <div class="content">
          ${content}
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportBankAccountsPDF(accounts: any[], currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Contas Bancárias</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #374151; max-width: 1000px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #1f2937; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          .summary { display: flex; justify-content: center; background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid ${primaryColor}; margin-bottom: 30px; }
          .summary-item { text-align: center; padding: 0 40px; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .summary-value { font-size: 24px; font-weight: 700; color: #1f2937; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 12px; font-size: 14px; vertical-align: middle; }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; border: none; }
          td { border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background-color: #f9fafb; }
          .text-right { text-align: right; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Status das Contas Bancárias</h1>
          <p>Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Saldo Consolidado Total</div>
            <div class="summary-value">${formatCurrency(totalBalance)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome da Conta</th>
              <th>Banco</th>
              <th>Tipo</th>
              <th class="text-right">Saldo Atual</th>
            </tr>
          </thead>
          <tbody>
            ${accounts
              .map(
                (a) => `
              <tr>
                <td style="font-family: monospace; color: #6b7280;">${a.code || '-'}</td>
                <td style="font-weight: 500; color: #111827;">${a.name}</td>
                <td>${a.bank_name}</td>
                <td>${a.type}</td>
                <td class="text-right" style="font-weight: 600; color: ${a.balance >= 0 ? '#059669' : '#dc2626'}">${formatCurrency(a.balance || 0)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">Documento gerado pelo Sistema de Gerenciamento Financeiro.</div>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportFinancialPlanilhaPDF(
  servicos: any[],
  pagamentos: any[],
  currentUser: string,
  settings: any = null,
  periodLabel: string,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Serviços Financeiros</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #374151; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #1f2937; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td {
            text-align: left;
            padding: 10px;
            font-size: 14px;
            vertical-align: middle;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; border: none; }
          td { border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background-color: #f9fafb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Relatório de Serviços Financeiros</h1>
          <p><strong>Período:</strong> ${periodLabel}</p>
          <p>Gerado por: ${currentUser} em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Projeto/Serviço</th>
              <th class="text-right">Valor da Parcela</th>
              <th class="text-center">Status</th>
              <th>Data de Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${pagamentos
              .map((p: any) => {
                const s = servicos.find((x) => x.id === p.servico_id)
                if (!s) return ''
                return `
                <tr>
                  <td>${s.cliente || '-'}</td>
                  <td>${s.projeto_servico || '-'}</td>
                  <td class="text-right">${formatCurrency(p.valor)}</td>
                  <td class="text-center">${p.status || 'Pendente'}</td>
                  <td>${p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportFinancialPDF(
  records: any[],
  totals: { revenue: number; expenses: number; balance: number },
  periodLabel: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - ${periodLabel}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #374151; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #1f2937; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .summary {
            display: flex;
            justify-content: space-around;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
            margin-bottom: 30px;
          }
          .summary-item { text-align: center; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .summary-value { font-size: 20px; font-weight: 700; color: #1f2937; margin-top: 5px; }
          .summary-value.positive { color: #059669; }
          .summary-value.negative { color: #dc2626; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td {
            text-align: left;
            padding: 10px;
            font-size: 14px;
            vertical-align: middle;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; border: none; }
          td { border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background-color: #f9fafb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .badge-reconciled { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .badge-pending { display: inline-block; padding: 2px 8px; border-radius: 12px; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Relatório Financeiro</h1>
          <p><strong>Período / Filtro:</strong> ${periodLabel}</p>
          <p>Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Receita Total</div>
            <div class="summary-value positive">${formatCurrency(totals.revenue)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Despesa Total</div>
            <div class="summary-value negative">${formatCurrency(totals.expenses)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Saldo</div>
            <div class="summary-value ${totals.balance >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(totals.balance)}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Conta Bancária</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th class="text-center">Status</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map((r: any) => {
                const isExpense =
                  r.type?.toLowerCase().includes('saída') ||
                  r.type?.toLowerCase().includes('despesa') ||
                  r.amount < 0
                const accountName = r.expand?.bank_account?.name || r.bank_account || '-'
                const accountCode = r.expand?.bank_account?.code
                  ? `${r.expand.bank_account.code} - `
                  : ''
                const badgeClass = r.reconciled ? 'badge-reconciled' : 'badge-pending'
                const badgeText = r.reconciled ? 'Conciliado' : 'Pendente'
                return `
                <tr>
                  <td style="white-space: nowrap;">${format(new Date(r.date || r.created), 'dd/MM/yyyy')}</td>
                  <td style="font-weight: 500; color: #111827;">${r.description}</td>
                  <td><span style="font-size: 12px; color: #6b7280;">${accountCode}</span>${accountName}</td>
                  <td>${r.category || '-'}</td>
                  <td>${r.type || '-'}</td>
                  <td class="text-center"><span class="${badgeClass}">${badgeText}</span></td>
                  <td class="text-right" style="color: ${isExpense ? '#dc2626' : '#059669'}; font-weight: 600;">
                    ${isExpense && r.amount > 0 ? '-' : ''}${formatCurrency(Math.abs(r.amount ?? r.value ?? 0))}
                  </td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Documento gerado pelo Sistema de Gerenciamento de Projetos.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportDistributionPDF(records: any[], currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const totalNet = records.reduce((sum, r) => sum + (r.net_value || 0), 0)
  const totalSamuel = records.reduce((sum, r) => sum + (r.samuel_amount || 0), 0)
  const totalTozzi = records.reduce((sum, r) => sum + (r.tozzi_amount || 0), 0)

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Distribuição de Lucros</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
          .summary { display: flex; justify-content: space-between; background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid ${primaryColor}; margin-bottom: 20px; }
          .summary-item { text-align: center; flex: 1; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .summary-value { font-size: 18px; font-weight: 700; margin-top: 5px; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Relatório de Distribuição de Lucros</h2>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Líquido Acumulado</div>
            <div class="summary-value">${formatCurrency(totalNet)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Samuel</div>
            <div class="summary-value" style="color: #2563eb;">${formatCurrency(totalSamuel)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Tozzi</div>
            <div class="summary-value" style="color: #059669;">${formatCurrency(totalTozzi)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th class="text-right">Bruto</th>
              <th class="text-right">NF</th>
              <th class="text-right">ART</th>
              <th class="text-right">Despesas</th>
              <th class="text-right">Cap. Giro</th>
              <th class="text-right">Líquido</th>
              <th class="text-right">Samuel</th>
              <th class="text-right">Tozzi</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r) => `
              <tr>
                <td>${format(new Date(r.date || r.created), 'dd/MM/yyyy')}</td>
                <td>${r.description}</td>
                <td class="text-right">${formatCurrency(r.total_amount)}</td>
                <td class="text-right">${formatCurrency(r.nf_amount || 0)}</td>
                <td class="text-right">${formatCurrency(r.art_amount || 0)}</td>
                <td class="text-right">${formatCurrency(r.expenses)}</td>
                <td class="text-right">${formatCurrency((r.total_amount || 0) * ((r.working_capital_pct || 0) / 100))}</td>
                <td class="text-right" style="font-weight: bold;">${formatCurrency(r.net_value)}</td>
                <td class="text-right" style="color: #2563eb; font-weight: 600;">${formatCurrency(r.samuel_amount)}</td>
                <td class="text-right" style="color: #059669; font-weight: 600;">${formatCurrency(r.tozzi_amount)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportCalendarPDF(
  tasks: any[],
  periodLabel: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório do Calendário</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Relatório de Tarefas Agendadas</h2>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">${periodLabel}</p>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Data de Entrega</th>
              <th>Projeto</th>
              <th>Disciplina</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr>
                <td>${t.title}</td>
                <td>${t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : '-'}</td>
                <td>${t.expand?.project?.name || '-'}</td>
                <td>${t.expand?.module?.name || '-'}</td>
                <td>${t.status}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportDisciplineTasksPDF(
  tasks: any[],
  moduleName: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Tarefas - ${moduleName}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          h2 { color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <h2 style="margin-bottom: 5px;">Relatório de Tarefas - ${moduleName}</h2>
        <p style="margin-top: 0; color: #6b7280; font-size: 14px; margin-bottom: 20px;">Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Descrição</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr>
                <td>${t.status || 'Pendente'}</td>
                <td>${t.title}</td>
                <td>${t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : '-'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportTasksPDF(
  tasks: any[],
  projectName: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Tarefas</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          h2 { color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <h2 style="margin-bottom: 5px;">Relatório de Tarefas - ${projectName}</h2>
        <p style="margin-top: 0; color: #6b7280; font-size: 14px; margin-bottom: 20px;">Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        <table>
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Responsável</th>
              <th>Data de Entrega</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr>
                <td>${t.title}</td>
                <td>${t.responsibleName || '-'}</td>
                <td>${t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : '-'}</td>
                <td>${t.status}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportAuditLogsPDF(logs: any[], currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Auditoria</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #1a1a1a; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            vertical-align: top;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          <h1>Relatório de Auditoria</h1>
          <p>Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Usuário</th>
              <th>Descrição</th>
              <th>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            ${logs
              .map((log: any) => {
                const changes =
                  log.changes.length > 0
                    ? log.changes
                        .map(
                          (c: any) =>
                            `${c.field}: ${c.oldValue || 'N/A'} &rarr; ${c.newValue || 'N/A'}`,
                        )
                        .join('<br/>')
                    : 'N/A'
                const description = `<strong>${log.entityName}</strong><br/>${changes}`

                return `
                <tr>
                  <td>${log.action}</td>
                  <td>${log.user.name}</td>
                  <td>${description}</td>
                  <td style="white-space: nowrap;">${format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</td>
                </tr>
              `
              })
              .join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Documento gerado pelo Sistema de Gerenciamento de Projetos.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportQuotePDF(quote: any, currentUser: string = 'Usuário', settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''
  const headerHtml = settings
    ? `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px;">
      <div>
        ${logoUrl ? `<img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
        <h1 style="margin: 0; color: ${primaryColor}; font-size: 24px;">${settings.company_name || 'Proposta Comercial'}</h1>
        ${settings.cnpj ? `<p style="margin: 2px 0 0; color: #6b7280; font-size: 12px;">CNPJ: ${settings.cnpj}</p>` : ''}
        ${settings.address ? `<p style="margin: 2px 0 0; color: #6b7280; font-size: 12px;">${settings.address}</p>` : ''}
        ${settings.phone ? `<p style="margin: 2px 0 0; color: #6b7280; font-size: 12px;">${settings.phone}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Ref:</strong> ${quote.id || 'N/A'}</p>
        <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;"><strong>Data:</strong> ${quote.date || 'N/A'}</p>
      </div>
    </div>
  `
    : `
    <div class="header">
      <h1>Proposta Comercial</h1>
      <p><strong>Ref:</strong> ${quote.id || 'N/A'} &bull; <strong>Data:</strong> ${quote.date || 'N/A'}</p>
    </div>
  `

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Comercial - ${quote.id}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #1a1a1a; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
          }
          .info-item { margin-bottom: 10px; }
          .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .info-value { font-size: 16px; color: #111827; font-weight: 500; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
          th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; }
          .text-right { text-align: right; }
          .total-row { font-weight: 700; font-size: 18px; background-color: #f3f4f6; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        ${headerHtml}
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Cliente</div>
            <div class="info-value">${quote.clientName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Projeto</div>
            <div class="info-value">${quote.projectName || 'N/A'}</div>
          </div>
        </div>

        <h3 style="font-size: 16px; margin-bottom: 15px; color: ${primaryColor};">Itens da Proposta</h3>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">V. Unitário</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(quote.items || [])
              .map(
                (item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              `,
              )
              .join('')}
            <tr class="total-row">
              <td colspan="3" class="text-right" style="padding: 15px 12px;">Valor Total Estimado:</td>
              <td class="text-right" style="padding: 15px 12px; color: #059669;">${formatCurrency(quote.value)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          Documento gerado em ${new Date().toLocaleDateString('pt-BR')} por ${currentUser}.<br/>
          Este documento tem validade de 15 dias após a data de emissão.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportProjectHoursPDF(
  logs: any[],
  project: Project,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const totalHours = logs.reduce((acc: number, log: any) => acc + log.hours, 0)
  const estimatedHours = project.estimatedHours || 100

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Horas - ${project.name}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #1a1a1a; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .summary {
            display: flex;
            justify-content: space-around;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
            margin-bottom: 30px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
          }
          .summary-value {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-top: 5px;
          }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            vertical-align: top;
          }
          th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          <h1>Relatório de Horas</h1>
          <p><strong>Projeto:</strong> ${project.name} &bull; <strong>Cliente:</strong> ${project.client}</p>
          <p>Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Horas Estimadas</div>
            <div class="summary-value">${estimatedHours}h</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Horas Realizadas</div>
            <div class="summary-value">${totalHours}h</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Status</div>
            <div class="summary-value" style="color: ${totalHours > estimatedHours ? '#dc2626' : '#059669'}">
              ${totalHours > estimatedHours ? 'Acima da Estimativa' : 'Dentro da Estimativa'}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Membro</th>
              <th>Atividade</th>
              <th style="text-align: right;">Horas</th>
            </tr>
          </thead>
          <tbody>
            ${logs
              .map(
                (log: any) => `
                <tr>
                  <td style="white-space: nowrap;">${format(new Date(log.date), 'dd/MM/yyyy')}</td>
                  <td>${log.user.name}</td>
                  <td>${log.task?.name || 'N/A'}</td>
                  <td style="text-align: right; font-weight: 500;">${log.hours}h</td>
                </tr>
              `,
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="footer">
          Documento gerado pelo Sistema de Gerenciamento de Projetos.
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function exportAccessReportPDF(
  users: any[],
  accessList: any[],
  projects: any[],
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Acessos</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Relatório de Acessos de Usuários</h2>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome do Usuário</th>
              <th>Função (Role)</th>
              <th>Projetos Vinculados</th>
              <th>Nível de Acesso</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((u) => {
                const userAccesses = accessList.filter((a) => a.user === u.id)
                if (userAccesses.length === 0) {
                  return `
                    <tr>
                      <td>${u.name || u.email}</td>
                      <td>${u.role || '-'}</td>
                      <td style="color: #6b7280;">Nenhum projeto associado</td>
                      <td>-</td>
                    </tr>
                  `
                }
                return userAccesses
                  .map((acc, index) => {
                    const proj = projects.find((p) => p.id === acc.project)
                    return `
                    <tr>
                      ${index === 0 ? `<td rowspan="${userAccesses.length}">${u.name || u.email}</td>` : ''}
                      ${index === 0 ? `<td rowspan="${userAccesses.length}">${u.role || '-'}</td>` : ''}
                      <td>${proj?.name || '-'}</td>
                      <td>${acc.access_level}</td>
                    </tr>
                  `
                  })
                  .join('')
              })
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportApaDashboardPDF(
  data: {
    dateFilter: string
    disciplineFilter: string
    topProblems: any[]
    effectivenessData: any[]
    tableData: any[]
  },
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const filterLabel =
    data.dateFilter === '3m'
      ? 'Últimos 3 Meses'
      : data.dateFilter === '6m'
        ? 'Últimos 6 Meses'
        : 'Último Ano'
  const discLabel = data.disciplineFilter === 'all' ? 'Todas as Disciplinas' : data.disciplineFilter

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard de Lições Aprendidas</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; max-width: 1000px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; color: ${primaryColor}; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-weight: bold; }
          .card { background: #f9fafb; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Dashboard de Lições Aprendidas (APA)</h2>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Período: ${filterLabel} | Disciplina: ${discLabel}</p>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">1. Recorrência de Problemas (Top 5)</div>
          <div class="card">
            ${data.topProblems.length === 0 ? '<p>Nenhum problema registrado no período.</p>' : ''}
            ${data.topProblems
              .map((p) => {
                const maxCount = Math.max(...data.topProblems.map((tp) => tp.count))
                const pct = (p.count / maxCount) * 100
                return `
                 <div style="margin-bottom: 10px;">
                   <div style="font-size: 12px; margin-bottom: 2px; font-weight: 500;">${p.name} (${p.count})</div>
                   <div style="width: 100%; background: #e5e7eb; border-radius: 4px; height: 16px;">
                     <div style="width: ${pct}%; background: ${primaryColor}; height: 100%; border-radius: 4px;"></div>
                   </div>
                 </div>
               `
              })
              .join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Efetividade de Ações Concluídas</div>
          <div class="card" style="display: flex; gap: 20px; align-items: center;">
            ${
              data.effectivenessData[0].value === 0 && data.effectivenessData[1].value === 0
                ? '<p>Nenhuma ação concluída no período.</p>'
                : `
              <div style="flex: 1;">
                 <div style="font-weight: bold; color: #10b981; font-size: 18px;">No Prazo: ${data.effectivenessData[0].value}</div>
                 <div style="font-weight: bold; color: #ef4444; font-size: 18px; margin-top: 10px;">Atrasadas: ${data.effectivenessData[1].value}</div>
              </div>
            `
            }
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Comparativo por Disciplina</div>
          <table>
            <thead>
              <tr>
                <th>Disciplina</th>
                <th style="text-align: center;">Total APAs</th>
                <th style="text-align: center;">Problemas (Média/Proj)</th>
                <th>Taxa de Efetividade (%)</th>
              </tr>
            </thead>
            <tbody>
              ${data.tableData.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhum dado disponível.</td></tr>' : ''}
              ${data.tableData
                .map(
                  (r) => `
                <tr>
                  <td style="font-weight: bold;">${r.discipline}</td>
                  <td style="text-align: center;">${r.totalApas}</td>
                  <td style="text-align: center;">${r.avgProblems}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="min-width: 40px; font-weight: 600;">${r.effectiveness}%</span>
                      <div style="flex: 1; background: #e5e7eb; border-radius: 4px; height: 8px;">
                        <div style="width: ${r.effectiveness}%; background: ${r.effectiveness > 70 ? '#10b981' : r.effectiveness > 40 ? '#f59e0b' : '#ef4444'}; height: 100%; border-radius: 4px;"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>

      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportDesignerDashboardPDF(
  user: any,
  projects: any[],
  urgentTasks: any[],
  financeData: any,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório do Painel - ${user.name}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; max-width: 1000px; margin: 0 auto; }
          .header { border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; text-align: center; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; color: ${primaryColor}; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: white; font-size: 12px; text-transform: uppercase; }
          .summary-grid { display: flex; gap: 20px; margin-bottom: 20px; }
          .summary-card { background: #f9fafb; padding: 15px; border-radius: 8px; flex: 1; border-left: 4px solid ${primaryColor}; }
          .summary-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #111827; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" />` : ''}
          <h1>Relatório de Painel - ${user.name}</h1>
          <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        ${
          financeData
            ? `
        <div class="section">
          <div class="section-title">Resumo Financeiro</div>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total em Serviços</h3>
              <p>${formatCurrency(financeData.total)}</p>
            </div>
            <div class="summary-card">
              <h3>Recebido</h3>
              <p style="color: #059669;">${formatCurrency(financeData.recebido)}</p>
            </div>
            <div class="summary-card">
              <h3>A Receber</h3>
              <p style="color: #d97706;">${formatCurrency(financeData.aReceber)}</p>
            </div>
          </div>
        </div>
        `
            : ''
        }

        <div class="section">
          <div class="section-title">Atividades do Dia (Urgentes)</div>
          ${
            urgentTasks.length === 0
              ? '<p style="color: #6b7280;">Nenhuma atividade urgente.</p>'
              : `
          <table>
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Projeto</th>
                <th>Prazo</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              ${urgentTasks
                .map(
                  (t) => `
                <tr>
                  <td>${t.title}</td>
                  <td>${t.expand?.project?.name || '-'}</td>
                  <td>${t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>${t.priority || 'Normal'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          `
          }
        </div>

        <div class="section">
          <div class="section-title">Progresso dos Projetos</div>
          ${
            projects.length === 0
              ? '<p style="color: #6b7280;">Nenhum projeto ativo.</p>'
              : `
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Cliente</th>
                <th>Progresso</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${projects
                .map(
                  (p) => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.client || '-'}</td>
                  <td>${p.progress || 0}%</td>
                  <td>${p.status}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          `
          }
        </div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportWeeklyDocsReportPDF(
  documents: any[],
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Semanal de Documentos</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
          .badge-urgent { background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .badge-normal { background-color: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Relatório Semanal de Documentos e Feedbacks</h2>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Projeto</th>
              <th>Documento</th>
              <th>Tipo</th>
              <th>Prioridade</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            ${documents.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: #6b7280;">Nenhum documento encontrado nos últimos 7 dias.</td></tr>' : ''}
            ${documents
              .map(
                (doc) => `
              <tr>
                <td style="white-space: nowrap;">${format(new Date(doc.created), 'dd/MM/yyyy')}</td>
                <td>${doc.expand?.project?.name || '-'}</td>
                <td>${doc.name}</td>
                <td>${doc.type || '-'}</td>
                <td><span class="${doc.is_urgent ? 'badge-urgent' : 'badge-normal'}">${doc.is_urgent ? 'Urgente' : 'Normal'}</span></td>
                <td>${doc.feedback || '-'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportCommentsPDF(
  comments: any[],
  projectName: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const topLevel = comments.filter((c) => !c.parent_id)

  const renderComment = (c: any, isReply = false) => {
    const authorName = c.expand?.autor?.name || 'Desconhecido'
    const date = new Date(c.created).toLocaleString('pt-BR')
    const margin = isReply
      ? 'margin-left: 40px; border-left: 2px solid #e5e7eb; padding-left: 15px;'
      : 'margin-bottom: 20px;'

    return `
      <div style="${margin} margin-top: 10px; background: ${isReply ? '#f9fafb' : '#ffffff'}; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 8px; font-size: 12px; color: #6b7280;">
          <strong style="color: #111827; font-size: 14px;">${authorName}</strong> &bull; ${date}
        </div>
        <div style="font-size: 14px; color: #374151; white-space: pre-wrap;">
          ${c.mensagem}
        </div>
      </div>
    `
  }

  let commentsHtml = ''
  topLevel.forEach((c) => {
    commentsHtml += renderComment(c)
    const replies = comments.filter((r) => r.parent_id === c.id)
    replies.forEach((r) => {
      commentsHtml += renderComment(r, true)
    })
  })

  if (comments.length === 0) {
    commentsHtml =
      '<p style="text-align: center; color: #6b7280;">Nenhum comentário encontrado.</p>'
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Discussão - ${projectName}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Histórico de Discussão</h2>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Projeto: ${projectName}</p>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        <div>
          ${commentsHtml}
        </div>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportMeetingMinutesPDF(
  meeting: any,
  minutesContent: string,
  currentUser: string,
  settings: any = null,
  participants: any[] = [],
  actions: any[] = [],
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''
  const projectName = meeting.expand?.project?.name || 'N/A'

  const presentIds = meeting.attendance || []
  const presentParticipants = participants.filter((p) => presentIds.includes(p.id))
  const absentParticipants = participants.filter((p) => !presentIds.includes(p.id))

  const presentList =
    presentParticipants.length > 0
      ? presentParticipants.map((p) => p.name || p.email).join(', ')
      : 'Nenhum'
  const absentList =
    absentParticipants.length > 0
      ? absentParticipants.map((p) => p.name || p.email).join(', ')
      : 'Nenhum'

  let actionsHtml = ''
  if (actions && actions.length > 0) {
    actionsHtml = `
      <div style="margin-top: 40px; page-break-inside: auto;">
        <h3 style="color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 5px; font-size: 18px; margin-bottom: 0;">Plano de Ação (Tarefas)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; background-color: ${primaryColor}; color: white; font-size: 12px; text-transform: uppercase;">Ação</th>
              <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; background-color: ${primaryColor}; color: white; font-size: 12px; text-transform: uppercase;">Responsável</th>
              <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; background-color: ${primaryColor}; color: white; font-size: 12px; text-transform: uppercase;">Prazo</th>
              <th style="text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; background-color: ${primaryColor}; color: white; font-size: 12px; text-transform: uppercase;">Prioridade</th>
            </tr>
          </thead>
          <tbody>
            ${actions
              .map((a: any) => {
                const priority = a.expand?.task?.priority || a.priority || 'Média'
                const pColor =
                  priority === 'Alta' || priority === 'Urgente'
                    ? '#ef4444'
                    : priority === 'Média'
                      ? '#eab308'
                      : '#3b82f6'
                return `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${a.description}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${a.expand?.responsible?.name || '-'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${a.due_date ? new Date(a.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px;"><span style="background-color: ${pColor}20; color: ${pColor}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid ${pColor}40;">${priority}</span></td>
              </tr>
            `
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Ata de Reunião - ${meeting.title}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px; }
          .content { font-size: 14px; white-space: pre-wrap; }
          .content h1, .content h2, .content h3 { color: ${primaryColor}; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Ata de Reunião</h2>
            <h3 style="margin: 5px 0 0; color: #111827;">${meeting.title}</h3>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Projeto: ${projectName}</p>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Data: ${meeting.date_time ? new Date(meeting.date_time).toLocaleString('pt-BR') : '-'}</p>
            <p style="margin: 5px 0 0;">Duração: ${meeting.duration} min</p>
            <p style="margin: 5px 0 0;">Gerado por: ${currentUser}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 14px; color: #374151;">
          <p style="margin: 0;"><strong>Presentes:</strong> ${presentList}</p>
          <p style="margin: 5px 0 0;"><strong>Ausentes:</strong> ${absentList}</p>
        </div>
        
        <div class="content">
          ${minutesContent || '<p>Sem conteúdo na ata.</p>'}
        </div>
        
        ${actionsHtml}
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportMeetingsDashboardPDF(data: any, currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard de Reuniões</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          th { background-color: ${primaryColor}; color: #ffffff; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 20px; }
          .summary-grid { display: flex; gap: 20px; margin-bottom: 20px; }
          .summary-card { background: #f9fafb; padding: 15px; border-radius: 8px; flex: 1; border-left: 4px solid ${primaryColor}; }
          .summary-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #111827; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; color: ${primaryColor};">Dashboard de Reuniões</h2>
            <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">${data.periodLabel}</p>
          </div>
          <div style="text-align: right; color: #6b7280; font-size: 14px;">
            Gerado por: ${currentUser}<br/>
            Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total de Reuniões</h3>
            <p>${data.metrics.totalMeetings}</p>
          </div>
          <div class="summary-card">
            <h3>Duração Média (min)</h3>
            <p>${Math.round(data.metrics.avgTime)}</p>
          </div>
        </div>

        <h3 style="color: ${primaryColor}; margin-top: 30px;">Próximas Reuniões</h3>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Data/Hora</th>
              <th>Projeto</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.upcoming
              .map(
                (m: any) => `
              <tr>
                <td>${m.title}</td>
                <td>${m.date_time ? format(new Date(m.date_time), 'dd/MM/yyyy HH:mm') : '-'}</td>
                <td>${m.expand?.project?.name || '-'}</td>
                <td>${m.status}</td>
              </tr>
            `,
              )
              .join('')}
            ${data.upcoming.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhuma reunião futura.</td></tr>' : ''}
          </tbody>
        </table>

        <h3 style="color: ${primaryColor}; margin-top: 30px;">Reuniões Recentes</h3>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Data</th>
              <th>Projeto</th>
              <th>Duração</th>
            </tr>
          </thead>
          <tbody>
            ${data.recent
              .map(
                (m: any) => `
              <tr>
                <td>${m.title}</td>
                <td>${m.date_time ? format(new Date(m.date_time), 'dd/MM/yyyy') : '-'}</td>
                <td>${m.expand?.project?.name || '-'}</td>
                <td>${m.duration} min</td>
              </tr>
            `,
              )
              .join('')}
            ${data.recent.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhuma reunião recente.</td></tr>' : ''}
          </tbody>
        </table>

        <h3 style="color: ${primaryColor}; margin-top: 30px;">Ações Pendentes</h3>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.actions
              .map(
                (a: any) => `
              <tr>
                <td>${a.description}</td>
                <td>${a.expand?.responsible?.name || '-'}</td>
                <td>${a.due_date ? format(new Date(a.due_date), 'dd/MM/yyyy') : '-'}</td>
                <td>${a.status}</td>
              </tr>
            `,
              )
              .join('')}
            ${data.actions.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Nenhuma ação pendente.</td></tr>' : ''}
          </tbody>
        </table>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}

export function exportUserPDF(
  user: any,
  projects: Project[],
  settings: any = null,
  providedWindow: Window | null = null,
) {
  const printWindow = providedWindow || window.open('', '_blank')
  if (!printWindow) return

  const primaryColor = getPrimaryColor(settings)
  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : 'N/A')

  const addressStr =
    [user.logradouro, user.numero, user.bairro, user.cidade, user.uf, user.cep]
      .filter(Boolean)
      .join(', ') ||
    user.address ||
    'N/A'

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Profissional - ${user.name}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.5; 
            color: #1a1a1a; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .section { margin-bottom: 30px; page-break-inside: avoid; border-left: 3px solid ${primaryColor}; padding-left: 15px; }
          .section h2 { 
            font-size: 16px; 
            color: ${primaryColor}; 
            border-bottom: 1px solid #e5e7eb; 
            padding-bottom: 8px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: 600; font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .value { font-size: 14px; color: #111827; margin-top: 2px; }
          
          .project-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .project-table th, .project-table td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .project-table th { font-weight: 600; color: #ffffff; background-color: ${primaryColor}; font-size: 12px; text-transform: uppercase; }
          
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px dashed #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af; 
            text-align: center; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ''}
          <h1>${user.name}</h1>
          <p>${user.formacao || user.specialty || 'Profissional'} • ${user.role || 'Membro da Equipe'}</p>
        </div>
        
        <div class="section">
          <h2>Dados Pessoais</h2>
          <div class="grid-3">
            <div class="field"><div class="label">Nome Completo</div><div class="value">${user.name}</div></div>
            <div class="field"><div class="label">CPF</div><div class="value">${user.cpf || 'N/A'}</div></div>
            <div class="field"><div class="label">RG</div><div class="value">${user.rg || 'N/A'}</div></div>
            <div class="field"><div class="label">CREA</div><div class="value">${user.crea || 'N/A'}</div></div>
            <div class="field"><div class="label">Data de Nasc.</div><div class="value">${formatDate(user.birth_date)}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Dados Profissionais</h2>
          <div class="grid-3">
            <div class="field"><div class="label">Código (ID)</div><div class="value">${user.codigo || 'N/A'}</div></div>
            <div class="field"><div class="label">Formação</div><div class="value">${user.formacao || user.specialty || 'N/A'}</div></div>
            <div class="field"><div class="label">Cargo</div><div class="value">${user.role || 'N/A'}</div></div>
            <div class="field"><div class="label">Status Atual</div><div class="value">${user.status || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Contato & Endereço</h2>
          <div class="grid">
            <div class="field"><div class="label">Email</div><div class="value">${user.email || 'N/A'}</div></div>
            <div class="field"><div class="label">Telefone</div><div class="value">${user.phone || 'N/A'}</div></div>
            <div class="field"><div class="label">Telefone Alternativo</div><div class="value">${user.altPhone || 'N/A'}</div></div>
            <div class="field" style="grid-column: span 2;"><div class="label">Endereço Completo</div><div class="value">${addressStr}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Dados Bancários</h2>
          <div class="grid">
            <div class="field"><div class="label">Banco</div><div class="value">${user.banco_nome || user.bankData?.bank || 'N/A'}</div></div>
            <div class="field"><div class="label">Agência</div><div class="value">${user.agencia || user.bankData?.agency || 'N/A'}</div></div>
            <div class="field"><div class="label">Conta</div><div class="value">${user.conta || user.bankData?.account || 'N/A'}</div></div>
            <div class="field"><div class="label">Chave PIX</div><div class="value">${user.chave_pix || user.bankData?.pix || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Notas & Documentos</h2>
          <div class="grid">
            <div class="field" style="grid-column: span 2;"><div class="label">Anotações Gerais</div><div class="value">${user.notes || 'N/A'}</div></div>
            <div class="field" style="grid-column: span 2;"><div class="label">Link para Documentação</div><div class="value">${user.documentos_link ? `<a href="${user.documentos_link}" target="_blank">${user.documentos_link}</a>` : 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Projetos Associados (${projects.length})</h2>
          ${
            projects.length > 0
              ? `
            <table class="project-table">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Cliente</th>
                  <th>Disciplina</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${projects
                  .map(
                    (p) => `
                  <tr>
                    <td style="font-weight: 500;">${p.name}</td>
                    <td>${p.client}</td>
                    <td>${p.discipline}</td>
                    <td>${p.status}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : '<p style="color: #6b7280; font-size: 14px;">Nenhum projeto associado no momento.</p>'
          }
        </div>
        
        <div class="footer">
          Documento gerado pelo Sistema de Gerenciamento de Projetos.<br/>
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </div>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}
