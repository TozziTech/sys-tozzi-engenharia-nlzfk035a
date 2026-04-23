onRecordAfterDeleteSuccess((e) => {
  const userId = e.record.getString('user')
  const projectId = e.record.getString('project')

  try {
    const project = $app.findRecordById('projects', projectId)

    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('user', userId)
    notif.set('title', 'Acesso Revogado')
    notif.set('message', `Seu acesso ao projeto ${project.getString('name')} foi revogado.`)
    notif.set('is_important', true)
    notif.set('action_type', 'access_revoked')
    $app.save(notif)

    const authRecord = e.requestInfo().auth
    const adminId = authRecord ? authRecord.id : userId
    const audit = new Record($app.findCollectionByNameOrId('audit_logs'))
    audit.set('user_id', adminId)
    audit.set('action', 'access_revoked')
    audit.set('resource', 'user_project_access')
    audit.set('details', {
      target_user: userId,
      project_id: projectId,
      project_name: project.getString('name'),
    })
    $app.save(audit)
  } catch (err) {}

  e.next()
}, 'user_project_access')
