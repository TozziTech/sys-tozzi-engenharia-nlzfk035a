onRecordAfterUpdateSuccess((e) => {
  const oldRecord = e.original
  const newRecord = e.record
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

  log.set('action', 'Documento Atualizado')
  log.set('resource', newRecord.get('name') || newRecord.id)
  log.set('details', {
    name: {
      old: oldRecord.get('name'),
      new: newRecord.get('name'),
    },
    type: {
      old: oldRecord.get('type'),
      new: newRecord.get('type'),
    },
  })

  $app.save(log)

  e.next()
}, 'project_documents')
