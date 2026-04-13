import { User, Project } from '@/types/project'

import { format } from 'date-fns'

export function exportBankAccountsPDF(accounts: any[], currentUser: string, settings: any = null) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
          .header { text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #1f2937; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          .summary { display: flex; justify-content: center; background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37; margin-bottom: 30px; }
          .summary-item { text-align: center; padding: 0 40px; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .summary-value { font-size: 24px; font-weight: 700; color: #1f2937; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { text-align: left; padding: 12px; font-size: 14px; vertical-align: middle; }
          th { font-weight: 600; color: #f9fafb; background-color: #1f2937; font-size: 12px; text-transform: uppercase; border: none; }
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

export function exportFinancialPDF(
  records: any[],
  totals: { revenue: number; expenses: number; balance: number },
  periodLabel: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
            border-bottom: 3px solid #d4af37;
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
            border-left: 4px solid #d4af37;
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
          th { font-weight: 600; color: #f9fafb; background-color: #1f2937; font-size: 12px; text-transform: uppercase; border: none; }
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

export function exportCalendarPDF(
  tasks: any[],
  periodLabel: string,
  currentUser: string,
  settings: any = null,
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
          th { background-color: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #fef3c7; color: #92400e; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px;">
          <strong>Nota:</strong> A impressão iniciará automaticamente.
        </div>
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0;">Relatório de Tarefas Agendadas</h2>
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

export function exportDisciplineTasksPDF(tasks: any[], moduleName: string, currentUser: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
          th { background-color: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
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

export function exportTasksPDF(tasks: any[], projectName: string, currentUser: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
          th { background-color: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; }
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

export function exportAuditLogsPDF(logs: any[], currentUser: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; color: #111827; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            vertical-align: top;
          }
          th { font-weight: 600; color: #4b5563; background-color: #f9fafb; font-size: 12px; text-transform: uppercase; }
          
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
          <p><strong>Skip Projetos S/A</strong> &bull; Gerado por: ${currentUser} em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const logoUrl = settings?.logo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company_settings/${settings.id}/${settings.logo}`
    : ''
  const headerHtml = settings
    ? `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
      <div>
        ${logoUrl ? `<img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
        <h1 style="margin: 0; color: #111827; font-size: 24px;">${settings.company_name || 'Proposta Comercial'}</h1>
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
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; color: #111827; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
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
          th { font-weight: 600; color: #4b5563; background-color: #f9fafb; font-size: 12px; text-transform: uppercase; }
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

        <h3 style="font-size: 16px; margin-bottom: 15px; color: #374151;">Itens da Proposta</h3>
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

export function exportProjectHoursPDF(logs: any[], project: Project, currentUser: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 { margin: 0; color: #111827; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .summary {
            display: flex;
            justify-content: space-around;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
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
          th { font-weight: 600; color: #4b5563; background-color: #f9fafb; font-size: 12px; text-transform: uppercase; }
          
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

export function exportUserPDF(
  user: any,
  projects: Project[],
  settings: any = null,
  providedWindow: Window | null = null,
) {
  const printWindow = providedWindow || window.open('', '_blank')
  if (!printWindow) return

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
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { margin: 0; color: #111827; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
          
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { 
            font-size: 16px; 
            color: #374151; 
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
          .project-table th { font-weight: 600; color: #4b5563; background-color: #f9fafb; font-size: 12px; text-transform: uppercase; }
          
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
