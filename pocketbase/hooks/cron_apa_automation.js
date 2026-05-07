cronAdd('apa_automation', '0 8 * * *', () => {
  const settingsRecords = $app.findRecordsByFilter('company_settings', '1=1', '', 1, 0)
  let triggerDays = 7
  if (settingsRecords.length > 0) {
    const val = settingsRecords[0].getInt('apa_trigger_days')
    if (val > 0) triggerDays = val
  }

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - triggerDays)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  const projects = $app.findRecordsByFilter(
    'projects',
    "status = 'Concluído' && end_date != '' && end_date <= {:targetDate}",
    '-created',
    1000,
    0,
    { targetDate: targetDateStr + ' 23:59:59.999Z' },
  )

  let adminUser = null
  try {
    adminUser = $app.findAuthRecordByEmail('_pb_users_auth_', 'tozziengenharia@hotmail.com')
  } catch (_) {
    const admins = $app.findRecordsByFilter('users', "role = 'Administrador'", '', 1, 0)
    if (admins.length > 0) adminUser = admins[0]
  }

  if (!adminUser) return

  for (const project of projects) {
    try {
      $app.findFirstRecordByFilter('apa_reports', 'project = {:project}', { project: project.id })
      continue // APA exists
    } catch (_) {
      // Create APA
      const apaCollection = $app.findCollectionByNameOrId('apa_reports')
      const apaRecord = new Record(apaCollection)
      apaRecord.set('project', project.id)
      apaRecord.set('status', 'pendente')
      apaRecord.set('created_by', adminUser.id)
      apaRecord.set('positive_points', '')
      apaRecord.set('negative_points', '')
      apaRecord.set('lessons_learned', '')
      apaRecord.set('corrective_plan', '')
      $app.save(apaRecord)

      // Notify managers
      const accessRecords = $app.findRecordsByFilter(
        'user_project_access',
        'project = {:project}',
        '',
        100,
        0,
        { project: project.id },
      )

      let notifiedUsers = []

      for (const access of accessRecords) {
        try {
          const user = $app.findRecordById('users', access.getString('user'))
          if (user.getString('role') === 'Gerente de Projeto') {
            notifiedUsers.push(user.id)
          }
        } catch (_) {}
      }

      if (notifiedUsers.length === 0) {
        const admins = $app.findRecordsByFilter('users', "role = 'Administrador'", '', 100, 0)
        notifiedUsers = admins.map((a) => a.id)
      }

      const notifCollection = $app.findCollectionByNameOrId('notifications')
      for (const userId of notifiedUsers) {
        const notifRecord = new Record(notifCollection)
        notifRecord.set('user', userId)
        notifRecord.set('title', 'APA Pendente: ' + project.getString('name'))
        notifRecord.set(
          'message',
          'A Análise Pós-Ação para o projeto ' +
            project.getString('name') +
            ' está pendente. Clique aqui para preencher.',
        )
        notifRecord.set('link', '/apa/new?project=' + project.id)
        notifRecord.set('read', false)
        notifRecord.set('is_important', true)
        notifRecord.set('action_type', 'Alerta de urgência')
        $app.save(notifRecord)
      }
    }
  }
})
