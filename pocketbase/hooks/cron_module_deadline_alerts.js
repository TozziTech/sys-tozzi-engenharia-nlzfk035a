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

  const usersCache = {}
  const getUser = (id) => {
    if (!id) return null
    if (usersCache[id] !== undefined) return usersCache[id]
    try {
      const u = $app.findRecordById('users', id)
      usersCache[id] = u
      return u
    } catch (_) {
      usersCache[id] = null
      return null
    }
  }

  for (const mod of modules) {
    const deadlineStr = mod.getString('deadline')
    if (!deadlineStr) continue

    const deadline = new Date(deadlineStr)
    deadline.setUTCHours(0, 0, 0, 0)

    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const moduleName = mod.getString('name')
    const projectId = mod.getString('project')
    const link = `/projects/${projectId}/disciplines/${mod.id}`

    const notifyUser = (userId) => {
      const user = getUser(userId)
      if (!user) return

      let leadDays = user.getInt('deadline_lead_days')
      if (!leadDays || leadDays < 1) leadDays = 3 // default

      let alertType = ''
      let title = ''
      let message = ''

      if (diffDays === leadDays) {
        alertType = `${leadDays}_days`
        title = 'Prazo Próximo'
        message = `Atenção: A disciplina ${moduleName} vence em ${leadDays} dia(s).`
      } else if (diffDays === 0) {
        alertType = 'today'
        title = 'Prazo Hoje'
        message = `Urgente: A disciplina ${moduleName} vence hoje!`
      } else if (diffDays < 0) {
        alertType = 'overdue'
        title = 'Prazo Expirado'
        message = `Atraso: A disciplina ${moduleName} está com o prazo expirado.`
      }

      if (!alertType) return

      const payload = mod.id + ':' + alertType

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
