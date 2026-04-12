routerAdd(
  'GET',
  '/backend/v1/calendar/tasks.ics',
  (e) => {
    const tasks = $app.findRecordsByFilter('tasks', "due_date != ''", '', 1000, 0)

    let ics = 'BEGIN:VCALENDAR\r\n'
    ics += 'VERSION:2.0\r\n'
    ics += 'PRODID:-//Skip Cloud//Tasks//EN\r\n'
    ics += 'CALSCALE:GREGORIAN\r\n'

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      ics += 'BEGIN:VEVENT\r\n'
      ics += `SUMMARY:${t.get('title')}\r\n`

      const dateStr = t.get('due_date').replace(' ', 'T')
      const dateObj = new Date(dateStr)

      if (!isNaN(dateObj.getTime())) {
        const dtStart = dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const dtEnd =
          new Date(dateObj.getTime() + 60 * 60 * 1000)
            .toISOString()
            .replace(/[-:]/g, '')
            .split('.')[0] + 'Z'
        ics += `DTSTART:${dtStart}\r\n`
        ics += `DTEND:${dtEnd}\r\n`
      }

      ics += `UID:task-${t.get('id')}@skip.cloud\r\n`
      ics += `DESCRIPTION:${(t.get('description') || '').replace(/\n/g, '\\n')}\r\n`
      ics += 'END:VEVENT\r\n'
    }

    ics += 'END:VCALENDAR\r\n'

    e.response.header().set('Content-Type', 'text/calendar; charset=utf-8')
    e.response.header().set('Content-Disposition', 'attachment; filename="tasks.ics"')
    return e.string(200, ics)
  },
  $apis.requireAuth(),
)
