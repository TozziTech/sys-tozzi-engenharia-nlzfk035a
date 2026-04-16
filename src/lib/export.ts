import { type Contact } from '@/services/contacts'

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

  const escapeCSV = (str: string | undefined | null) => {
    if (!str) return '""'
    const clean = String(str).replace(/"/g, '""')
    return `"${clean}"`
  }

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

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `contatos_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
