onRecordUpdateRequest((e) => {
  const authRecord = e.auth
  if (!authRecord) {
    throw new UnauthorizedError('Authentication required.')
  }

  const body = e.requestInfo().body

  if (body.role !== undefined) {
    if (authRecord.get('role') !== 'Administrador') {
      const currentRole = e.record.get('role')
      if (body.role !== currentRole) {
        throw new ForbiddenError('Apenas Administradores podem modificar níveis de acesso.')
      }
    }
  }

  const oldValues = {}
  const newValues = {}
  let hasChanges = false

  for (const key in body) {
    if (
      [
        'updated',
        'created',
        'password',
        'passwordConfirm',
        'id',
        'collectionId',
        'collectionName',
      ].includes(key)
    )
      continue

    const oldVal = e.record.get(key)
    const newVal = body[key]

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      oldValues[key] = oldVal
      newValues[key] = newVal
      hasChanges = true
    }
  }

  e.next()

  if (hasChanges) {
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const auditRecord = new Record(auditCol)
      auditRecord.set('user_id', authRecord.id)
      const targetName = e.record.get('name') || e.record.get('codigo') || 'Membro'
      auditRecord.set('action', 'Atualizou Perfil: ' + targetName)
      auditRecord.set('resource', 'users')
      auditRecord.set('details', {
        target_user_id: e.record.id,
        target_name: targetName,
        old_values: oldValues,
        new_values: newValues,
      })
      $app.saveNoValidate(auditRecord)
    } catch (err) {
      console.error('Audit log error:', err)
    }
  }
}, 'users')
