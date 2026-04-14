onRecordAfterCreateSuccess((e) => {
  const record = e.record
  if (!record.get('is_recurring')) {
    e.next()
    return
  }

  const groupId = record.get('recurrence_group_id')
  if (!groupId) {
    e.next()
    return
  }

  try {
    const result = new DynamicModel({ c: 0 })
    $app
      .db()
      .newQuery(
        'SELECT COUNT(id) as c FROM financial_records WHERE recurrence_group_id = {:groupId}',
      )
      .bind({ groupId: groupId })
      .one(result)

    if (result.c > 1) {
      e.next()
      return
    }
  } catch (err) {
    console.log('Error checking count', err)
    e.next()
    return
  }

  const freq = record.get('frequency')
  if (!freq) {
    e.next()
    return
  }

  let startDateStr = record.get('date')
  if (!startDateStr) {
    e.next()
    return
  }
  startDateStr = startDateStr.replace(' ', 'T')

  let endDateStr = record.get('end_date')
  let endDate = null
  if (endDateStr) {
    endDateStr = endDateStr.replace(' ', 'T')
    endDate = new Date(endDateStr)
  }

  const maxInstances = 12
  const collection = $app.findCollectionByNameOrId('financial_records')

  let currentDate = new Date(startDateStr)

  for (let i = 1; i <= maxInstances; i++) {
    if (freq === 'Semanal') {
      currentDate.setDate(currentDate.getDate() + 7)
    } else if (freq === 'Mensal') {
      let d = currentDate.getDate()
      currentDate.setMonth(currentDate.getMonth() + 1)
      if (currentDate.getDate() !== d) {
        currentDate.setDate(0)
      }
    } else if (freq === 'Anual') {
      currentDate.setFullYear(currentDate.getFullYear() + 1)
    } else {
      break
    }

    if (endDate && currentDate > endDate) {
      break
    }

    const newRecord = new Record(collection)
    newRecord.set('description', record.get('description'))
    newRecord.set('amount', record.get('amount'))
    newRecord.set('type', record.get('type'))
    newRecord.set('category', record.get('category'))
    newRecord.set('project_id', record.get('project_id'))
    newRecord.set('is_recurring', true)
    newRecord.set('frequency', freq)
    newRecord.set('responsible', record.get('responsible'))
    newRecord.set('bank_account', record.get('bank_account'))
    newRecord.set('recurrence_group_id', groupId)

    newRecord.set('status', 'Pendente')
    newRecord.set('reconciled', false)

    newRecord.set('date', currentDate.toISOString())

    if (record.get('end_date')) {
      newRecord.set('end_date', record.get('end_date'))
    }

    try {
      $app.save(newRecord)
    } catch (err) {
      console.log('Error saving recurring record', err)
      break
    }
  }

  e.next()
}, 'financial_records')
