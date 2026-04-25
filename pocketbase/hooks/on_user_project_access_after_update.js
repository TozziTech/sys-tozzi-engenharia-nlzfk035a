onRecordAfterUpdateSuccess((e) => {
  let userId = e.record.get('user')
  if (Array.isArray(userId)) userId = userId[0]

  let projectId = e.record.get('project')
  if (Array.isArray(projectId)) projectId = projectId[0]

  const accessLevel = e.record.getString('access_level')

  if (!projectId || !userId) {
    return e.next()
  }

  const project = $app.findRecordById('projects', projectId)

  const notif = new Record($app.findCollectionByNameOrId('notifications'))
  notif.set('user', userId)
  notif.set('title', 'Acesso Atualizado')
  notif.set(
    'message',
    `Seu acesso ao projeto ${project.getString('name')} foi alterado para ${accessLevel}.`,
  )
  notif.set('is_important', true)
  notif.set('action_type', 'access_updated')
  notif.set('link', `/projects/${projectId}`)
  $app.save(notif)

  let adminId = userId
  try {
    const authRecord = e.requestInfo().auth
    if (authRecord) {
      adminId = authRecord.id
    }
  } catch (err) {
    // e.requestInfo() might throw outside of active request hooks context
  }

  const audit = new Record($app.findCollectionByNameOrId('audit_logs'))
  audit.set('user_id', adminId)
  audit.set('action', 'access_updated')
  audit.set('resource', 'user_project_access')
  audit.set('details', {
    target_user: userId,
    project_id: projectId,
    project_name: project.getString('name'),
    access_level: accessLevel,
  })
  $app.save(audit)

  e.next()
}, 'user_project_access')
