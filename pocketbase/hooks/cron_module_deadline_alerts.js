cronAdd('cron_module_deadline_alerts', '0 0 * * *', () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const modules = $app.findRecordsByFilter(
    'project_modules',
    "status != 'Concluído' && deadline != ''",
    '',
    1000,
    0,
  )

  for (const mod of modules) {
    const deadlineStr = mod.getString('deadline')
    if (!deadlineStr) continue

    const deadline = new Date(deadlineStr)
    deadline.setUTCHours(0, 0, 0, 0)

    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let alertType = ''
    let title = ''
    let message = ''

    const moduleName = mod.getString('name')

    if (diffDays === 3) {
      alertType = '3_days'
      title = 'Prazo Próximo'
      message = `Atenção: A disciplina ${moduleName} vence em 3 dias.`
    } else if (diffDays === 0) {
      alertType = 'today'
      title = 'Prazo Hoje'
      message = `Urgente: A disciplina ${moduleName} vence hoje!`
    } else if (diffDays < 0) {
      alertType = 'overdue'
      title = 'Prazo Expirado'
      message = `Atraso: A disciplina ${moduleName} está com o prazo expirado.`
    }

    if (!alertType) continue

    const payload = mod.id + ':' + alertType
    const projectId = mod.getString('project')
    const link = `/projects/${projectId}/disciplines/${mod.id}`

    const notifyUser = (userId) => {
      if (!userId) return

      try {
        $app.findFirstRecordByFilter(
          'notifications',
          'user = {:user} && action_payload = {:payload}',
          { user: userId, payload: payload },
        )
        return // already notified for this threshold
      } catch (_) {}

      const notifCol = $app.findCollectionByNameOrId('notifications')
      const record = new Record(notifCol)
      record.set('user', userId)
      record.set('title', title)
      record.set('message', message)
      record.set('link', link)
      record.set('action_type', 'deadline_alert')
      record.set('action_payload', payload)
      record.set('is_important', diffDays <= 0)

      $app.save(record)
    }

    const resp = mod.getString('responsible')
    const des = mod.getString('designer')

    if (resp) notifyUser(resp)
    if (des && des !== resp) notifyUser(des)
  }
})
