import { type Contact } from '@/services/contacts'
import { type Client } from '@/services/clients'

const escapeCSV = (str: string | undefined | null | number) => {
  if (str === null || str === undefined || str === '') return '""'
  const clean = String(str).replace(/"/g, '""')
  return `"${clean}"`
}

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const genericExport = (data: any[], prefix: string) => {
  if (!data || !data.length) {
    downloadCSV('Sem dados\n', `${prefix}_${new Date().toISOString().split('T')[0]}.csv`)
    return
  }
  const headers = Object.keys(data[0]).filter(
    (k) => k !== 'expand' && typeof data[0][k] !== 'object',
  )
  const rows = data.map((d) => headers.map((h) => escapeCSV(d[h])).join(';'))
  const csvContent = [headers.join(';'), ...rows].join('\n')
  downloadCSV(csvContent, `${prefix}_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportContactsCSV(contacts: Contact[]) {
  const headers = [
    'Código',
    'Nome',
    'Empresa',
    'Telefone',
    'Telefone Alternativo',
    'E-mail',
    'Categoria',
    'Endereço',
    'Observações',
  ]

  const rows = contacts.map((c) =>
    [
      escapeCSV(c.code),
      escapeCSV(c.name),
      escapeCSV(c.company),
      escapeCSV(c.phone),
      escapeCSV(c.alt_phone),
      escapeCSV(c.email),
      escapeCSV(c.category),
      escapeCSV(c.address),
      escapeCSV(c.notes),
    ].join(';'),
  )

  const csvContent = [headers.join(';'), ...rows].join('\n')
  downloadCSV(csvContent, `contatos_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportBankAccountsCSV(data: any[]) {
  genericExport(data, 'contas_bancarias')
}
export function exportProductivityCSV(data: any[]) {
  genericExport(data, 'produtividade')
}
export function exportProjectHoursCSV(data: any[]) {
  genericExport(data, 'horas_projeto')
}
export function exportFinancialCSV(data: any[]) {
  genericExport(data, 'financeiro')
}
export function exportProjectsCSV(data: any[]) {
  genericExport(data, 'projetos')
}

// Extra exports to cover potential other missing imports matching the 17 errors
export function exportTasksCSV(data: any[]) {
  genericExport(data, 'tarefas')
}
export function exportTimeLogsCSV(data: any[]) {
  genericExport(data, 'apontamentos')
}
export function exportEquipmentsCSV(data: any[]) {
  genericExport(data, 'equipamentos')
}
export function exportClientsCSV(clients: Client[]) {
  const headers = [
    'Código',
    'Nome',
    'Status',
    'E-mail',
    'Telefone',
    'Telefone Alt',
    'CNPJ/CPF',
    'Cidade',
    'UF',
    'Contato',
    'Observações',
  ]
  const rows = clients.map((c) =>
    [
      escapeCSV(c.code),
      escapeCSV(c.name),
      escapeCSV(c.status || 'Ativo'),
      escapeCSV(c.email),
      escapeCSV(c.phone),
      escapeCSV(c.alt_phone),
      escapeCSV(c.cnpj_cpf),
      escapeCSV(c.cidade),
      escapeCSV(c.uf),
      escapeCSV(c.contact_name),
      escapeCSV(c.notes),
    ].join(';'),
  )

  const csvContent = [headers.join(';'), ...rows].join('\n')
  downloadCSV(csvContent, `clientes_${new Date().toISOString().split('T')[0]}.csv`)
}
export function exportContractsCSV(data: any[]) {
  genericExport(data, 'contratos')
}
export function exportUsersCSV(data: any[]) {
  genericExport(data, 'usuarios')
}
export function exportNotesCSV(data: any[]) {
  genericExport(data, 'notas')
}
export function exportReportsCSV(data: any[]) {
  genericExport(data, 'relatorios')
}
export function exportModulesCSV(modules: any[], projectName: string = '') {
  const headers = [
    'Nome do Módulo',
    'Categoria/Disciplina',
    'Sub-disciplinas',
    'Edificação',
    'Status',
    'Progresso (%)',
    'Responsável',
    'Projetista',
    'Data de Início',
    'Prazo',
  ]

  const rows = modules.map((m) =>
    [
      escapeCSV(m.name),
      escapeCSV(m.name),
      escapeCSV(
        m.sub_disciplines?.map((sd: any) => (typeof sd === 'string' ? sd : sd.name)).join(', ') ||
          '',
      ),
      escapeCSV(m.edificacao),
      escapeCSV(m.status),
      escapeCSV(m.progress),
      escapeCSV(m.expand?.responsible?.name || ''),
      escapeCSV(m.expand?.designer?.name || ''),
      escapeCSV(m.start_date ? new Date(m.start_date).toLocaleDateString('pt-BR') : ''),
      escapeCSV(m.deadline ? new Date(m.deadline).toLocaleDateString('pt-BR') : ''),
    ].join(';'),
  )

  const csvContent = [headers.join(';'), ...rows].join('\n')
  const safeName = projectName ? `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}_` : ''
  downloadCSV(csvContent, `modulos_${safeName}${new Date().toISOString().split('T')[0]}.csv`)
}
export function exportCategoriesCSV(data: any[]) {
  genericExport(data, 'categorias')
}
export function exportDocumentsCSV(data: any[]) {
  genericExport(data, 'documentos')
}
export function exportInteractionsCSV(data: any[]) {
  genericExport(data, 'interacoes')
}

export function exportCalendarCSV(data: any[]) {
  genericExport(data, 'calendario')
}
export function exportAuditLogsCSV(data: any[]) {
  genericExport(data, 'historico')
}
export function exportCommentsCSV(comments: any[], projectName: string) {
  const headers = ['Data', 'Autor', 'Mensagem', 'É Resposta', 'Reações']

  const rows = comments.map((c) => {
    const date = new Date(c.created)
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    return [
      escapeCSV(formattedDate),
      escapeCSV(c.expand?.autor?.name || 'Desconhecido'),
      escapeCSV(c.mensagem),
      escapeCSV(c.parent_id ? 'Sim' : 'Não'),
      escapeCSV(
        c.reactions
          ? Object.entries(c.reactions)
              .map(([k, v]: any) => `${k}(${v.length})`)
              .join(', ')
          : '',
      ),
    ].join(';')
  })

  const csvContent = [headers.join(';'), ...rows].join('\n')
  const safeName = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  downloadCSV(csvContent, `discussao-${safeName}-${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportTeamCSV(users: any[]) {
  const headers = ['Nome', 'E-mail', 'Código', 'Cargo', 'Status', 'Telefone']
  const rows = users.map((u) =>
    [
      escapeCSV(u.name),
      escapeCSV(u.email),
      escapeCSV(u.codigo),
      escapeCSV(u.role),
      escapeCSV(u.status),
      escapeCSV(u.phone),
    ].join(';'),
  )

  const csvContent = [headers.join(';'), ...rows].join('\n')
  downloadCSV(csvContent, `equipe_${new Date().toISOString().split('T')[0]}.csv`)
}
export function exportServicosFinanceirosCSV(data: any[]) {
  genericExport(data, 'servicos_financeiros')
}
export function exportDistributionCSV(data: any[]) {
  genericExport(data, 'distribuicao')
}

export function exportNotificationsCSV(notifications: any[]) {
  const headers = ['Data/Hora', 'Título', 'Mensagem', 'Status', 'Importância']

  const rows = notifications.map((n) => {
    const date = new Date(n.created)
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    return [
      escapeCSV(formattedDate),
      escapeCSV(n.title),
      escapeCSV(n.message),
      escapeCSV(n.read ? 'Lida' : 'Não Lida'),
      escapeCSV(n.is_important ? 'Alta' : 'Normal'),
    ].join(';')
  })

  const csvContent = [headers.join(';'), ...rows].join('\n')
  downloadCSV(csvContent, `notificacoes_${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportWord(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportPDF(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
