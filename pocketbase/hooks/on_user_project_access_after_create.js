onRecordAfterCreateSuccess((e) => {
  const userId = e.record.getString('user')
  const projectId = e.record.getString('project')
  const accessLevel = e.record.getString('access_level')

  const project = $app.findRecordById('projects', projectId)

  let recentlyNotified = false
  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString().replace('T', ' ')
    const recent = $app.findFirstRecordByFilter(
      'notifications',
      `user = "${userId}" && action_type = 'access_granted' && link = '/projects/${projectId}' && created >= "${fiveMinsAgo}"`,
    )
    if (recent) recentlyNotified = true
  } catch (_) {}

  if (!recentlyNotified) {
    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('user', userId)

    if (accessLevel === 'Edição') {
      notif.set('title', 'Novo Projeto Atribuído')
      notif.set(
        'message',
        `Você foi designado para o projeto ${project.getString('name')} com permissão de edição.`,
      )
    } else {
      notif.set('title', 'Acesso Concedido')
      notif.set(
        'message',
        `Você recebeu acesso de ${accessLevel} ao projeto ${project.getString('name')}.`,
      )
    }

    notif.set('is_important', true)
    notif.set('read', false)
    notif.set('action_type', 'access_granted')
    notif.set('link', `/projects/${projectId}`)
    $app.saveNoValidate(notif)
  }

  const authRecord = e.requestInfo().auth
  const adminId = authRecord ? authRecord.id : userId
  const audit = new Record($app.findCollectionByNameOrId('audit_logs'))
  audit.set('user_id', adminId)
  audit.set('action', 'access_granted')
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
