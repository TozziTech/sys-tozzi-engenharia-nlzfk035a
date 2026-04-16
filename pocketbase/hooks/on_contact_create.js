onRecordValidate((e) => {
  const record = e.record

  if (!record.getString('code') || record.getString('code').trim() === '') {
    try {
      const records = $app.findRecordsByFilter('contacts', "code ~ 'CTT-'", '-code', 1, 0)
      if (records.length > 0) {
        const lastCode = records[0].getString('code')
        const match = lastCode.match(/CTT-(\d+)/)
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1
          record.set('code', 'CTT-' + nextNum.toString().padStart(3, '0'))
        } else {
          record.set('code', 'CTT-001')
        }
      } else {
        record.set('code', 'CTT-001')
      }
    } catch (err) {
      record.set('code', 'CTT-001')
    }
  }

  e.next()
}, 'contacts')
