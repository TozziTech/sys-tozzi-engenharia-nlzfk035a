onRecordAfterUpdateSuccess((e) => {
  const auth = e.auth
  if (!auth) return e.next()

  const auditLogs = $app.findCollectionByNameOrId('audit_logs')
  const record = new Record(auditLogs)
  record.set('user_id', auth.id)
  record.set('action', 'Dados Atualizados')
  record.set('resource', 'clients')
  record.set('details', { client_id: e.record.id, name: e.record.getString('name') })
  $app.save(record)

  return e.next()
}, 'clients')
