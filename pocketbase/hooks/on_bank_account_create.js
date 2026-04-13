onRecordCreate((e) => {
  const record = e.record
  if (!record.get('code')) {
    let nextNum = 1
    try {
      const result = new DynamicModel({ max_code: '' })
      $app
        .db()
        .newQuery(
          "SELECT code as max_code FROM bank_accounts WHERE code LIKE 'CB-%' ORDER BY code DESC LIMIT 1",
        )
        .one(result)
      if (result.max_code) {
        const match = result.max_code.match(/CB-(\d+)/)
        if (match) {
          nextNum = parseInt(match[1], 10) + 1
        }
      }
    } catch (_) {
      // no records exist yet
    }
    record.set('code', `CB-${String(nextNum).padStart(3, '0')}`)
  }
  e.next()
}, 'bank_accounts')
