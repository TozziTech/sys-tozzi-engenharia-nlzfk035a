onRecordDelete((e) => {
  try {
    let userId = ''
    if (e.auth && e.auth.id) {
      userId = e.auth.id
    } else {
      try {
        const fallbackUser = $app.findFirstRecordByFilter('users', '1=1')
        if (fallbackUser) userId = fallbackUser.id
      } catch (_) {}
    }

    if (userId) {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)
      log.set('user_id', userId)
      log.set('action', 'delete')
      log.set('resource', 'project_modules')
      log.set('details', {
        deleted_module_id: e.record.id,
        module_name: e.record.get('name'),
      })
      $app.saveNoValidate(log)
    }
  } catch (err) {
    console.log('Audit log error in on_project_module_delete:', err)
  }
  e.next()
}, 'project_modules')
