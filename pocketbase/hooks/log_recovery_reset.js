routerAdd('POST', '/backend/v1/log-recovery-reset', (e) => {
  const body = e.requestInfo().body
  const userId = body.userId
  if (!userId) return e.badRequestError('Missing userId')

  try {
    const audit = new Record($app.findCollectionByNameOrId('audit_logs'))
    audit.set('user_id', userId)
    audit.set('action', 'PASSWORD_CHANGE')
    audit.set('resource', 'users')
    audit.set('details', { method: 'recovery_link' })
    $app.saveNoValidate(audit)
    return e.json(200, { success: true })
  } catch (err) {
    console.log('Error logging recovery reset:', err)
    return e.internalServerError('Failed to log')
  }
})
