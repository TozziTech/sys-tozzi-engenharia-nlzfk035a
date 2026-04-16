cronAdd('cleanup_trash', '0 0 * * *', () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  const dateStr = d.toISOString().replace('T', ' ')

  const records = $app.findRecordsByFilter(
    'projects',
    "deleted_at != '' && deleted_at <= {:date}",
    '',
    1000,
    0,
    { date: dateStr },
  )

  for (let record of records) {
    try {
      $app.delete(record)
      console.log('Permanently deleted project: ' + record.id)
    } catch (err) {
      console.log('Error permanently deleting project ' + record.id + ': ' + err)
    }
  }
})
