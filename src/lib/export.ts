import { format } from 'date-fns'
import { Log } from './mock-logs'
import { Project } from '@/types/project'

export function exportFinancialCSV(records: any[], periodLabel: string) {
  const headers = [
    'Identificação',
    'Data',
    'Descrição',
    'Categoria',
    'Conta Bancária',
    'Tipo',
    'Status',
    'Valor',
    'Conciliado',
  ]

  const rows = records.map((r) => {
    const code = `"${r.code || ''}"`
    const date = `"${format(new Date(r.date || r.created), 'dd/MM/yyyy')}"`
    const desc = `"${(r.description || '').replace(/"/g, '""')}"`
    const cat = `"${(r.category || '').replace(/"/g, '""')}"`
    const account = `"${r.expand?.bank_account?.code ? `${r.expand.bank_account.code} - ` : ''}${(r.expand?.bank_account?.name || r.bank_account || '').replace(/"/g, '""')}"`
    const type = `"${(r.type || '').replace(/"/g, '""')}"`
    const status = `"${(r.status || 'Pendente').replace(/"/g, '""')}"`
    const val = r.amount ?? r.value ?? 0
    const reconciled = r.reconciled ? '"Sim"' : '"Não"'
    return [code, date, desc, cat, account, type, status, val, reconciled]
  })

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Financeiro_${periodLabel}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportBankAccountsCSV(accounts: any[]) {
  const headers = ['Código', 'Nome', 'Banco', 'Tipo', 'Saldo Atual']

  const rows = accounts.map((a) => [
    `"${a.code || ''}"`,
    `"${(a.name || '').replace(/"/g, '""')}"`,
    `"${(a.bank_name || '').replace(/"/g, '""')}"`,
    `"${a.type || ''}"`,
    a.balance || 0,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Contas_Bancarias_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTeamCSV(users: any[]) {
  const headers = ['Código', 'Nome', 'Formação', 'Status', 'Cidade', 'UF']

  const rows = users.map((u) => [
    `"${u.codigo || ''}"`,
    `"${(u.name || '').replace(/"/g, '""')}"`,
    `"${(u.formacao || u.specialty || '').replace(/"/g, '""')}"`,
    `"${u.status || ''}"`,
    `"${(u.cidade || '').replace(/"/g, '""')}"`,
    `"${(u.uf || '').replace(/"/g, '""')}"`,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Equipe_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProjectsCSV(projects: Project[]) {
  const headers = [
    'Nome do Projeto',
    'Status',
    'Progresso (%)',
    'Responsável',
    'Cliente',
    'Disciplina',
    'Início',
    'Fim',
    'Orçamento',
    'Gasto',
  ]

  const rows = projects.map((p) => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.status}"`,
    p.progress,
    `"${p.engineer.replace(/"/g, '""')}"`,
    `"${p.client.replace(/"/g, '""')}"`,
    `"${p.discipline}"`,
    p.startDate,
    p.endDate,
    p.budget || 0,
    p.spent || 0,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Projetos_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProjectHoursCSV(logs: any[], projectName: string) {
  const headers = ['Data', 'Membro', 'Atividade', 'Horas']

  const rows = logs.map((log) => [
    `"${format(new Date(log.date), 'dd/MM/yyyy')}"`,
    `"${log.user.name.replace(/"/g, '""')}"`,
    `"${log.task?.name?.replace(/"/g, '""') || 'N/A'}"`,
    log.hours,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Horas_${projectName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCalendarCSV(tasks: any[]) {
  const headers = ['Tarefa', 'Data de Entrega', 'Projeto', 'Disciplina', 'Status', 'Descrição']

  const rows = tasks.map((t) => {
    const title = `"${(t.title || '').replace(/"/g, '""')}"`
    const date = t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : ''
    const project = `"${(t.expand?.project?.name || '').replace(/"/g, '""')}"`
    const module = `"${(t.expand?.module?.name || '').replace(/"/g, '""')}"`
    const status = `"${(t.status || '').replace(/"/g, '""')}"`
    const desc = `"${(t.description || '').replace(/"/g, '""')}"`
    return [title, date, project, module, status, desc]
  })

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Calendario_Tarefas_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTasksCSV(tasks: any[], projectName: string) {
  const headers = ['Tarefa', 'Responsável', 'Data de Entrega', 'Status']

  const rows = tasks.map((t) => {
    const title = `"${(t.title || '').replace(/"/g, '""')}"`
    const resp = `"${(t.responsibleName || '').replace(/"/g, '""')}"`
    const date = t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : ''
    const status = `"${(t.status || '').replace(/"/g, '""')}"`
    return [title, resp, date, status]
  })

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Tarefas_${projectName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportDisciplineTasksCSV(tasks: any[], moduleName: string) {
  const headers = ['Status', 'Descrição', 'Data']

  const rows = tasks.map((t) => {
    const status = `"${(t.status || 'Pendente').replace(/"/g, '""')}"`
    const desc = `"${(t.title || '').replace(/"/g, '""')}"`
    const date = t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : ''
    return [status, desc, date]
  })

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Tarefas_${moduleName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportAuditLogsCSV(logs: Log[]) {
  const headers = ['Evento', 'Usuário', 'Descrição', 'Data/Hora']

  const rows = logs.map((log) => {
    const event = `"${log.action}"`
    const user = `"${log.user.name.replace(/"/g, '""')}"`
    const date = `"${format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}"`

    const changes =
      log.changes.length > 0
        ? log.changes
            .map((c: any) => `${c.field}: ${c.oldValue || 'N/A'} -> ${c.newValue || 'N/A'}`)
            .join(' | ')
        : 'N/A'
    const description = `"${log.entityName.replace(/"/g, '""')} - ${changes.replace(/"/g, '""')}"`

    return [event, user, description, date]
  })

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Auditoria_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProductivityCSV(stats: any[]) {
  const headers = [
    'Membro',
    'Tarefas Atribuídas',
    'Tarefas Concluídas',
    'Tarefas Pendentes/Atrasadas',
    'Horas Registradas',
    'Eficiência (%)',
  ]

  const rows = stats.map((s) => [
    `"${(s.name || '').replace(/"/g, '""')}"`,
    s.totalTasks,
    s.completedTasks,
    s.pendingTasks,
    s.totalHours,
    s.efficiency,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Produtividade_Equipe_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportContactsCSV(contacts: any[]) {
  const headers = ['Nome', 'Empresa', 'Telefone', 'Email', 'Categoria']

  const rows = contacts.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contatos_export_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportServicosFinanceirosCSV(
  records: any[],
  pagamentosPorServico: Record<string, number> = {},
) {
  const headers = [
    'Código',
    'Cliente',
    'Projeto/Serviço',
    'Data de Início',
    'Valor Total',
    'Valor Pago',
    'Valor Restante',
    'Status',
  ]

  const rows = records.map((s) => {
    const codigo = `"${(s.codigo || '').replace(/"/g, '""')}"`
    const cliente = `"${(s.cliente || '').replace(/"/g, '""')}"`
    const projeto = `"${(s.projeto_servico || '').replace(/"/g, '""')}"`
    const data = s.data_inicio ? `"${format(new Date(s.data_inicio), 'dd/MM/yyyy')}"` : '""'
    const valorTotal = s.valor_total || 0
    const valorPago = pagamentosPorServico[s.id] || 0
    const valorRestante = valorTotal - valorPago > 0 ? valorTotal - valorPago : 0
    const status = `"${(s.status || '').replace(/"/g, '""')}"`

    return [codigo, cliente, projeto, data, valorTotal, valorPago, valorRestante, status]
  })

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `servicos_financeiros_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportWord(content: string, filename: string) {
  const text = content.replace(/\n/g, '<br/>')
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Documento</title></head><body><div style='font-family: serif; font-size: 12pt;'>`
  const footer = '</div></body></html>'
  const html = header + text + footer
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportExcel(logs: Log[], totalProjects: number) {
  const escapeXml = (unsafe: string) =>
    unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;'
        case '>':
          return '&gt;'
        case '&':
          return '&amp;'
        case "'":
          return '&apos;'
        case '"':
          return '&quot;'
        default:
          return c
      }
    })

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="BoldHeader">
      <Font ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Audit Log">
    <Table>
      <Column ss:AutoFitWidth="1" ss:Width="120"/>
      <Column ss:AutoFitWidth="1" ss:Width="120"/>
      <Column ss:AutoFitWidth="1" ss:Width="80"/>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Row>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Date</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Author</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Action</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Entity</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Old Value</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">New Value</Data></Cell>
      </Row>
      ${logs
        .map((log) => {
          if (log.changes.length === 0) {
            return `
            <Row>
              <Cell><Data ss:Type="String">${escapeXml(format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm'))}</Data></Cell>
              <Cell><Data ss:Type="String">${escapeXml(log.user.name)}</Data></Cell>
              <Cell><Data ss:Type="String">${escapeXml(log.action)}</Data></Cell>
              <Cell><Data ss:Type="String">${escapeXml(log.entityName)}</Data></Cell>
              <Cell><Data ss:Type="String"></Data></Cell>
              <Cell><Data ss:Type="String"></Data></Cell>
            </Row>
          `
          }
          return log.changes
            .map(
              (change) => `
          <Row>
            <Cell><Data ss:Type="String">${escapeXml(format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm'))}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(log.user.name)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(log.action)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(log.entityName)} - ${escapeXml(change.field)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(change.oldValue || '')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(change.newValue || '')}</Data></Cell>
          </Row>
        `,
            )
            .join('')
        })
        .join('')}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Summary">
    <Table>
      <Column ss:AutoFitWidth="1" ss:Width="150"/>
      <Column ss:AutoFitWidth="1" ss:Width="100"/>
      <Row>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Metric</Data></Cell>
        <Cell ss:StyleID="BoldHeader"><Data ss:Type="String">Value</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Projects</Data></Cell>
        <Cell><Data ss:Type="Number">${totalProjects}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Logs</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.length}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Updates</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.filter((l) => l.action === 'Update').length}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Creations</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.filter((l) => l.action === 'Create').length}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Deletions</Data></Cell>
        <Cell><Data ss:Type="Number">${logs.filter((l) => l.action === 'Delete').length}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `System_Data_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
