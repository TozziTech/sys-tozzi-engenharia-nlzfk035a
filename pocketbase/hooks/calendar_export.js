routerAdd(
  'GET',
  '/backend/v1/calendar/projects.ics',
  (e) => {
    const projects = $app.findRecordsByFilter(
      'projects',
      "end_date != '' && status != 'Concluído'",
      '',
      1000,
      0,
    )

    let ics = 'BEGIN:VCALENDAR\r\n'
    ics += 'VERSION:2.0\r\n'
    ics += 'PRODID:-//Skip Cloud//Projects//EN\r\n'
    ics += 'CALSCALE:GREGORIAN\r\n'

    projects.forEach((p) => {
      ics += 'BEGIN:VEVENT\r\n'
      ics += `SUMMARY:Projeto: ${p.get('name')}\r\n`

      const dateStr = p.get('end_date').replace(' ', 'T')
      const dateObj = new Date(dateStr)

      if (!isNaN(dateObj.getTime())) {
        const dt = dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        ics += `DTSTART:${dt}\r\n`
        ics += `DTEND:${dt}\r\n`
      }

      ics += `UID:${p.get('id')}@skip.cloud\r\n`
      ics += `DESCRIPTION:Status: ${p.get('status')}\r\n`
      ics += 'END:VEVENT\r\n'
    })

    ics += 'END:VCALENDAR\r\n'

    e.response.header().set('Content-Type', 'text/calendar; charset=utf-8')
    e.response.header().set('Content-Disposition', 'attachment; filename="projects.ics"')
    return e.string(200, ics)
  },
  $apis.requireAuth(),
)
