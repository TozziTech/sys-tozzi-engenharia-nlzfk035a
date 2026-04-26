cronAdd('cleanup_presence', '*/10 * * * *', () => {
  const tenMinsAgo =
    new Date(Date.now() - 10 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19) + 'Z'
  $app
    .db()
    .newQuery('DELETE FROM project_presence WHERE last_active < {:time}')
    .bind({ time: tenMinsAgo })
    .execute()
})
