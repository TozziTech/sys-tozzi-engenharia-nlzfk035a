onRecordUpdateRequest((e) => {
  try {
    let original = null
    try {
      original = $app.findRecordById('project_modules', e.record.id)
    } catch (_) {
      return e.next()
    }

    const changes = {}
    const fields = ['name', 'status', 'progress', 'deadline', 'notes', 'responsible', 'designer']

    for (const field of fields) {
      const oldVal = original.get(field)
      const newVal = e.record.get(field)

      const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : ''
      const newStr = newVal !== null && newVal !== undefined ? String(newVal) : ''

      if (oldStr !== newStr) {
        changes[field] = { old: oldVal, new: newVal }
      }
    }

    if (Object.keys(changes).length > 0) {
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
        log.set('action', 'update')
        log.set('resource', 'project_modules')
        log.set('details', changes)
        $app.saveNoValidate(log)
      }
    }
  } catch (err) {
    console.log('Audit log error in on_project_module_update:', err)
  }

  return e.next()
}, 'project_modules')
