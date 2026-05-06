cronAdd('meeting_reminders', '*/15 * * * *', () => {
  const now = new Date()

  const start24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const end24 = new Date(start24.getTime() + 15 * 60 * 1000)

  const start1 = new Date(now.getTime() + 60 * 60 * 1000)
  const end1 = new Date(start1.getTime() + 15 * 60 * 1000)

  const formatForFilter = (d) => d.toISOString().replace('T', ' ')

  try {
    let alertDays = 1
    const allSettings = $app.findRecordsByFilter('company_settings', '', '', 1, 0)
    if (allSettings.length > 0) {
      const days = allSettings[0].getInt('contact_alert_days')
      if (days > 0) alertDays = days
    }

    const targetDate = new Date(now.getTime() + alertDays * 24 * 60 * 60 * 1000)
    const y = targetDate.getUTCFullYear()
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0')
    const d = String(targetDate.getUTCDate()).padStart(2, '0')
    const targetStart = `${y}-${m}-${d} 00:00:00`
    const targetEnd = `${y}-${m}-${d} 23:59:59`

    const recordsTasks = $app.findRecordsByFilter(
      'tasks',
      `status != 'Concluído' && due_date >= '${targetStart}' && due_date <= '${targetEnd}'`,
      '',
      1000,
      0,
    )

    for (const t of recordsTasks) {
      const resp = t.getString('responsible')
      if (!resp) continue

      const notifKey = `task_deadline:${t.id}:${y}${m}${d}`

      const existing = $app.findRecordsByFilter(
        'notifications',
        `action_payload = '${notifKey}'`,
        '',
        1,
        0,
      )

      if (existing.length === 0) {
        const notif = new Record($app.findCollectionByNameOrId('notifications'))
        notif.set('user', resp)
        notif.set('title', 'Lembrete de Tarefa')
        notif.set('message', `A tarefa "${t.getString('title')}" vence em ${alertDays} dia(s).`)
        notif.set('is_important', true)
        notif.set('action_type', 'task_reminder')
        notif.set('action_payload', notifKey)
        notif.set(
          'link',
          t.getString('project') ? `/projects/${t.getString('project')}` : '/dashboard',
        )
        $app.save(notif)

        $app.logger().info('Task reminder notification created', 'taskId', t.id)
      }
    }

    const records24 = $app.findRecordsByFilter(
      'meetings',
      `status = 'Pendente' && date_time >= '${formatForFilter(start24)}' && date_time < '${formatForFilter(end24)}'`,
      '',
      100,
      0,
    )
    for (const r of records24) {
      $app
        .logger()
        .info(
          'Mock Reminder: 24h notification sent to participants',
          'meetingId',
          r.id,
          'title',
          r.getString('title'),
        )
    }

    const records1 = $app.findRecordsByFilter(
      'meetings',
      `status = 'Pendente' && date_time >= '${formatForFilter(start1)}' && date_time < '${formatForFilter(end1)}'`,
      '',
      100,
      0,
    )
    for (const r of records1) {
      $app
        .logger()
        .info(
          'Mock Reminder: 1h notification sent to participants',
          'meetingId',
          r.id,
          'title',
          r.getString('title'),
        )
    }
  } catch (err) {
    $app.logger().error('Error running meeting reminders cron', 'err', err.message)
  }
})
