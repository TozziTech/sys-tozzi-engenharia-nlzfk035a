onRecordAfterCreateSuccess((e) => {
  const record = $app.findRecordById('users', e.record.id)
  record.setVerified(true)
  $app.saveNoValidate(record)

  e.next()
}, 'users')
