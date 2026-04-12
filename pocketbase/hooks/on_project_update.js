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

      if (e.auth) {
        log.set('user_id', e.auth.id)
      } else {
        const fallbackUser = $app.findFirstRecordByFilter('users', '1=1')
        if (fallbackUser) log.set('user_id', fallbackUser.id)
      }

      log.set('action', 'Update')
      log.set('resource', original.get('name') || 'Projeto')
      log.set('details', changes)

      $app.saveNoValidate(log)
    } catch (err) {
      console.log('Audit log error:', err)
    }
  }

  e.next()
}, 'projects')
