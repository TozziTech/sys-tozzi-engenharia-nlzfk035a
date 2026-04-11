import { User, Project } from '@/types/project'

import { format } from 'date-fns'

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

export function exportUserPDF(user: User, projects: Project[]) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

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
          <strong>Nota:</strong> Este é um relatório temporário gerado a partir de dados em memória. A impressão iniciará automaticamente.
        </div>
      
        <div class="header">
          <h1>${user.name}</h1>
          <p>${user.specialty || 'Profissional'} • ${user.role || 'Membro da Equipe'}</p>
        </div>
        
        <div class="section">
          <h2>Dados Pessoais e Profissionais</h2>
          <div class="grid">
            <div class="field"><div class="label">Nome Completo</div><div class="value">${user.name}</div></div>
            <div class="field"><div class="label">CREA</div><div class="value">${user.crea || 'N/A'}</div></div>
            <div class="field"><div class="label">Cargo</div><div class="value">${user.role || 'N/A'}</div></div>
            <div class="field"><div class="label">Especialidade</div><div class="value">${user.specialty || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Contato</h2>
          <div class="grid">
            <div class="field"><div class="label">Email</div><div class="value">${user.email || 'N/A'}</div></div>
            <div class="field"><div class="label">Telefone</div><div class="value">${user.phone || 'N/A'}</div></div>
            <div class="field" style="grid-column: span 2;"><div class="label">Endereço</div><div class="value">${user.address || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Dados Bancários</h2>
          <div class="grid">
            <div class="field"><div class="label">Banco</div><div class="value">${user.bankData?.bank || 'N/A'}</div></div>
            <div class="field"><div class="label">Agência</div><div class="value">${user.bankData?.agency || 'N/A'}</div></div>
            <div class="field"><div class="label">Conta</div><div class="value">${user.bankData?.account || 'N/A'}</div></div>
            <div class="field"><div class="label">Chave PIX</div><div class="value">${user.bankData?.pix || 'N/A'}</div></div>
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

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 250)
}
