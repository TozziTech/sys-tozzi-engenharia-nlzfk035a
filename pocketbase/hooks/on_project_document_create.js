onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const auditLogs = $app.findCollectionByNameOrId('audit_logs')
  const log = new Record(auditLogs)

  let userId = e.auth?.id
  if (!userId) {
    try {
      const admin = $app.findFirstRecordByFilter('users', "role = 'Administrador'")
      userId = admin.id
    } catch (err) {}
  }

  if (userId) {
    log.set('user_id', userId)
  }

  log.set('action', 'Documento Adicionado')
  log.set('resource', record.get('name') || record.id)
  log.set('details', {
    type: { new: record.get('type') || '' },
  })

  $app.save(log)

  e.next()
}, 'project_documents')
