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

    // Grant "Edição" access automatically
    const projectId = e.record.get('project')
    const responsibleId = e.record.get('responsible')
    const designerId = e.record.get('designer')

    const grantAccess = (uId) => {
      if (!uId) return
      try {
        const existing = $app.findFirstRecordByFilter(
          'user_project_access',
          `user = "${uId}" && project = "${projectId}"`,
        )
        if (existing.get('access_level') !== 'Edição') {
          existing.set('access_level', 'Edição')
          $app.saveNoValidate(existing)
        }
      } catch (_) {
        const col = $app.findCollectionByNameOrId('user_project_access')
        const newRec = new Record(col)
        newRec.set('user', uId)
        newRec.set('project', projectId)
        newRec.set('access_level', 'Edição')
        $app.saveNoValidate(newRec)
      }
    }

    grantAccess(responsibleId)
    grantAccess(designerId)
  } catch (err) {
    console.log('Audit/Access log error in on_project_module_update:', err)
  }

  return e.next()
}, 'project_modules')
