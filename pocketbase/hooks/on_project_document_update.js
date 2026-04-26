onRecordAfterUpdateSuccess((e) => {
  try {
    const originalUrgent = e.record.original().getBool('is_urgent')
    const newUrgent = e.record.getBool('is_urgent')

    if (!originalUrgent && newUrgent) {
      const project = $app.findRecordById('projects', e.record.get('project'))
      const docName = e.record.getString('name') || 'Documento'
      const projectName = project.getString('name') || 'Projeto'

      const adminsAndManagers = $app.findRecordsByFilter(
        'users',
        "role = 'Administrador' || role = 'Gerente de Projeto'",
      )

      adminsAndManagers.forEach((user) => {
        const notif = new Record($app.findCollectionByNameOrId('notifications'))
        notif.set('user', user.id)
        notif.set('title', '⚠️ Documento Marcado como Urgente')
        notif.set(
          'message',
          `O documento ${docName} do projeto ${projectName} foi marcado como urgente.`,
        )
        notif.set('link', `/projects/${project.id}`)
        notif.set('is_important', true)
        notif.set('action_type', 'Alerta de urgência')
        $app.save(notif)
      })
    }
  } catch (err) {
    console.log('Error creating document update notification: ', err)
  }

  e.next()
}, 'project_documents')
