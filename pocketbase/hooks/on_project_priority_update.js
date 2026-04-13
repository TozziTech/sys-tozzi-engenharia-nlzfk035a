onRecordAfterUpdateSuccess((e) => {
  const oldPriority = e.original.get('is_priority')
  const newPriority = e.record.get('is_priority')

  if (oldPriority !== newPriority) {
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

    log.set('action', 'Prioridade Alterada')
    log.set('resource', e.record.get('name') || e.record.id)
    log.set('details', {
      is_priority: {
        old: oldPriority ? 'Sim' : 'Não',
        new: newPriority ? 'Sim' : 'Não',
      },
    })

    $app.save(log)
  }

  e.next()
}, 'projects')
