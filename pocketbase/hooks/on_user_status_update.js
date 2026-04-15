onRecordUpdateRequest((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus && newStatus && oldStatus !== newStatus && e.auth) {
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)

      log.set('user_id', e.auth.id)
      log.set('action', 'Alteração de Status')
      log.set('resource', 'users')
      log.set('details', {
        collaborator_id: e.record.id,
        collaborator_name: e.record.getString('name') || e.record.getString('email') || '',
        old_status: oldStatus,
        new_status: newStatus,
      })

      $app.saveNoValidate(log)
    } catch (err) {
      console.log('Error saving user status audit log:', err)
    }
  }

  return e.next()
}, 'users')
