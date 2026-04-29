onRecordCreate((e) => {
  if (e.record.getString('code')) {
    return e.next()
  }
  const records = $app.findRecordsByFilter('equipments', "code ~ 'EQP-%'", '', 10000, 0)
  let maxNum = 0
  for (const rec of records) {
    const num = parseInt(rec.getString('code').substring(4), 10)
    if (num > maxNum) maxNum = num
  }
  maxNum++
  e.record.set('code', 'EQP-' + String(maxNum).padStart(3, '0'))
  e.next()
}, 'equipments')
