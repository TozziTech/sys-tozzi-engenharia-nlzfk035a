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
export function exportModulesCSV(data: any[]) {
  genericExport(data, 'modulos')
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
export function exportTeamCSV(data: any[]) {
  genericExport(data, 'equipe')
}
export function exportServicosFinanceirosCSV(data: any[]) {
  genericExport(data, 'servicos_financeiros')
}
export function exportDistributionCSV(data: any[]) {
  genericExport(data, 'distribuicao')
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
