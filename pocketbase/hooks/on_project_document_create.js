onRecordAfterCreateSuccess((e) => {
  try {
    const project = $app.findRecordById('projects', e.record.get('project'))
    const isUrgent = e.record.getBool('is_urgent')
    const docName = e.record.getString('name') || 'Documento'
    const projectName = project.getString('name') || 'Projeto'

    const adminsAndManagers = $app.findRecordsByFilter(
      'users',
      "role = 'Administrador' || role = 'Gerente de Projeto'",
    )

    adminsAndManagers.forEach((user) => {
      const notif = new Record($app.findCollectionByNameOrId('notifications'))
      notif.set('user', user.id)
      notif.set('title', isUrgent ? '⚠️ Documento Urgente Adicionado' : 'Novo Documento Adicionado')
      notif.set('message', `O documento ${docName} foi adicionado ao projeto ${projectName}.`)
      notif.set('link', `/projects/${project.id}`)
      notif.set('is_important', isUrgent)
      notif.set('action_type', isUrgent ? 'Alerta de urgência' : 'upload_documento')
      $app.save(notif)
    })
  } catch (err) {
    console.log('Error creating document notification: ', err)
  }

  e.next()
}, 'project_documents')
