onRecordAfterCreateSuccess((e) => {
  if (!e.record.getString('status')) {
    e.record.set('status', 'Pendente')
    $app.saveNoValidate(e.record)
  }

  const userId = e.record.getString('user')
  const projectId = e.record.getString('project')
  const level = e.record.getString('requested_level')

  const user = $app.findRecordById('users', userId)
  const project = $app.findRecordById('projects', projectId)

  const admins = $app.findRecordsByFilter('users', "role = 'Administrador'", '', 100, 0)
  for (const admin of admins) {
    const notif = new Record($app.findCollectionByNameOrId('notifications'))
    notif.set('user', admin.id)
    notif.set('title', 'Nova Solicitação de Acesso')
    notif.set(
      'message',
      `${user.getString('name')} solicitou acesso de ${level} ao projeto ${project.getString('name')}.`,
    )
    notif.set('is_important', true)
    notif.set('link', '/admin/access-control')
    $app.save(notif)
  }

  e.next()
}, 'access_requests')
