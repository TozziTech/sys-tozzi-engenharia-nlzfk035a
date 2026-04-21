onRecordCreate((e) => {
  if (!e.record.getString('code')) {
    try {
      const records = $app.findRecordsByFilter('clients', "code ~ 'CLI-'", '-code', 1, 0)
      let nextNum = 1
      if (records.length > 0) {
        const lastCode = records[0].getString('code')
        const match = lastCode.match(/CLI-(\d+)/)
        if (match) {
          nextNum = parseInt(match[1], 10) + 1
        }
      }
      e.record.set('code', 'CLI-' + String(nextNum).padStart(3, '0'))
    } catch (err) {
      e.record.set('code', 'CLI-001')
    }
  }
  if (!e.record.getString('status')) {
    e.record.set('status', 'Ativo')
  }
  e.next()
}, 'clients')
