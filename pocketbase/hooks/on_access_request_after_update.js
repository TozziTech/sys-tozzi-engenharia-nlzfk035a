onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus !== newStatus && (newStatus === 'Aprovado' || newStatus === 'Negado')) {
    const userId = e.record.getString('user')
    const projectId = e.record.getString('project')
    const level = e.record.getString('requested_level')
    const notes = e.record.getString('admin_notes')

    const project = $app.findRecordById('projects', projectId)

    if (newStatus === 'Aprovado') {
      let accessRecord
      try {
        accessRecord = $app.findFirstRecordByFilter(
          'user_project_access',
          `user = '${userId}' && project = '${projectId}'`,
        )
        accessRecord.set('access_level', level)
      } catch (_) {
        const col = $app.findCollectionByNameOrId('user_project_access')
        accessRecord = new Record(col)
        accessRecord.set('user', userId)
        accessRecord.set('project', projectId)
        accessRecord.set('access_level', level)
      }
      $app.save(accessRecord)

      const userRec = $app.findRecordById('users', userId)
      let assigned = userRec.getStringSlice('assigned_projects') || []
      if (!assigned.includes(projectId)) {
        assigned.push(projectId)
        userRec.set('assigned_projects', assigned)
        $app.saveNoValidate(userRec)
      }
    } else if (newStatus === 'Negado') {
      const notif = new Record($app.findCollectionByNameOrId('notifications'))
      notif.set('user', userId)
      notif.set('title', 'Solicitação de Acesso Negada')
      notif.set(
        'message',
        `Sua solicitação de acesso ao projeto ${project.getString('name')} foi negada.${notes ? ' Motivo: ' + notes : ''}`,
      )
      notif.set('is_important', true)
      $app.save(notif)
    }
  }

  e.next()
}, 'access_requests')
