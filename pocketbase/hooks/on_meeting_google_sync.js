onRecordAfterCreateSuccess((e) => {
  const record = $app.findRecordById('meetings', e.record.id)

  // Mock Google Calendar integration
  const eventId = $security.randomString(16)
  const abc = $security.randomStringWithAlphabet(3, 'abcdefghijklmnopqrstuvwxyz')
  const def = $security.randomStringWithAlphabet(4, 'abcdefghijklmnopqrstuvwxyz')
  const ghi = $security.randomStringWithAlphabet(3, 'abcdefghijklmnopqrstuvwxyz')
  const meetLink = 'https://meet.google.com/' + abc + '-' + def + '-' + ghi

  record.set('google_event_id', eventId)
  record.set('meet_link', meetLink)
  $app.saveNoValidate(record)

  $app
    .logger()
    .info(
      'Mock Google Calendar: Event created and invitations sent to participants',
      'eventId',
      eventId,
      'meetLink',
      meetLink,
    )
  e.next()
}, 'meetings')

onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const eventId = record.getString('google_event_id')

  if (!eventId) {
    return e.next()
  }

  if (record.getString('status') === 'Cancelada') {
    $app.logger().info('Mock Google Calendar: Event canceled', 'eventId', eventId)
  } else {
    $app.logger().info('Mock Google Calendar: Event updated with new details', 'eventId', eventId)
  }

  e.next()
}, 'meetings')

onRecordAfterDeleteSuccess((e) => {
  const eventId = e.record.getString('google_event_id')
  if (eventId) {
    $app.logger().info('Mock Google Calendar: Event deleted', 'eventId', eventId)
  }
  e.next()
}, 'meetings')
