onRecordAfterDeleteSuccess((e) => {
  const meetingId = e.record.id

  const actions = $app.findRecordsByFilter(
    'meeting_actions',
    `meeting = '${meetingId}'`,
    '',
    100,
    0,
  )
  for (const a of actions) {
    try {
      $app.delete(a)
    } catch (_) {}
  }

  const versions = $app.findRecordsByFilter(
    'meeting_minutes_versions',
    `meeting = '${meetingId}'`,
    '',
    100,
    0,
  )
  for (const v of versions) {
    try {
      $app.delete(v)
    } catch (_) {}
  }

  const agendas = $app.findRecordsByFilter(
    'meeting_agenda_items',
    `meeting = '${meetingId}'`,
    '',
    100,
    0,
  )
  for (const ag of agendas) {
    try {
      $app.delete(ag)
    } catch (_) {}
  }

  const docs = $app.findRecordsByFilter('meeting_documents', `meeting = '${meetingId}'`, '', 100, 0)
  for (const d of docs) {
    try {
      $app.delete(d)
    } catch (_) {}
  }

  e.next()
}, 'meetings')
