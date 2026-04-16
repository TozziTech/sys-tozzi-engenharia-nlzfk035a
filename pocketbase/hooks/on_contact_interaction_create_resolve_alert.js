onRecordAfterCreateSuccess((e) => {
  const contactId = e.record.getString('contact')
  if (!contactId) return e.next()

  try {
    const unreadAlerts = $app.findRecordsByFilter(
      'notifications',
      "action_payload = {:payload} && action_type = 'contact_alert' && read = false",
      '',
      1000,
      0,
      { payload: contactId },
    )
    for (let alert of unreadAlerts) {
      alert.set('read', true)
      $app.save(alert)
    }
  } catch (err) {}

  return e.next()
}, 'contact_interactions')
