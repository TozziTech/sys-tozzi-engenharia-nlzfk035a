onRecordUpdateRequest((e) => {
  let original = null
  try {
    original = $app.findRecordById('projects', e.record.id)
  } catch (_) {
    return e.next()
  }

  const changes = {}
  const fields = [
    'status',
    'progress',
    'name',
    'client',
    'discipline',
    'engineer',
    'budget',
    'spent',
    'start_date',
    'end_date',
  ]

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
    try {
      const auditLogs = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogs)

      let userId = ''
      if (e.auth) {
        userId = e.auth.id
      } else {
        try {
          const fallbackUser = $app.findFirstRecordByFilter('users', '1=1')
          if (fallbackUser) userId = fallbackUser.id
        } catch (_) {}
      }

      if (userId) {
        log.set('user_id', userId)
      }

      log.set('action', 'update')
      log.set('resource', 'projects')
      log.set('details', changes)

      $app.save(log)
    } catch (err) {
      console.log('Audit log error:', err)
    }
  }

  return e.next()
}, 'projects')
