cronAdd('meeting_reminders', '*/15 * * * *', () => {
  const now = new Date()

  const start24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const end24 = new Date(start24.getTime() + 15 * 60 * 1000)

  const start1 = new Date(now.getTime() + 60 * 60 * 1000)
  const end1 = new Date(start1.getTime() + 15 * 60 * 1000)

  const formatForFilter = (d) => d.toISOString().replace('T', ' ')

  try {
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
