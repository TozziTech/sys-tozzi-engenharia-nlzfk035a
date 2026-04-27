onRecordUpdateRequest((e) => {
  const oldStatus = e.record.original().getString('status') || e.record.getString('status')

  e.next()

  const newStatus = e.record.getString('status')

  if (oldStatus !== newStatus && e.auth) {
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('user_id', e.auth.id)
      log.set('action', 'status_change')
      log.set('resource', 'project_modules')
      log.set('details', {
        module_id: e.record.id,
        module_name: e.record.getString('name'),
        from: oldStatus,
        to: newStatus,
      })
      $app.save(log)
    } catch (err) {
      $app.logger().error('Failed to save audit log', 'error', err.message)
    }
  }
}, 'project_modules')
