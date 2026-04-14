cronAdd('financial_recurrence', '0 0 * * *', () => {
  try {
    const records = $app.findRecordsByFilter(
      'financial_records',
      'is_recurring = true',
      'date',
      10000,
      0,
    )

    const groups = {}
    for (const rec of records) {
      const groupId = rec.getString('recurrence_group_id')
      if (!groupId) continue

      if (!groups[groupId] || rec.getString('date') > groups[groupId].getString('date')) {
        groups[groupId] = rec
      }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    for (const groupId in groups) {
      const latest = groups[groupId]
      const freq = latest.getString('frequency')
      const lastDateStr = latest.getString('date')
      if (!lastDateStr) continue

      let lastDate = new Date(lastDateStr)
      let nextDate = new Date(lastDate.getTime())

      if (freq === 'Semanal') {
        nextDate.setDate(nextDate.getDate() + 7)
      } else if (freq === 'Mensal') {
        nextDate.setMonth(nextDate.getMonth() + 1)
      } else if (freq === 'Anual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1)
      } else {
        continue
      }

      let iterations = 0
      while (nextDate <= now && iterations < 50) {
        iterations++
        const endDateStr = latest.getString('end_date')
        if (endDateStr) {
          const endDate = new Date(endDateStr)
          if (nextDate > endDate) {
            break
          }
        }

        const collection = $app.findCollectionByNameOrId('financial_records')
        const newRec = new Record(collection)
        newRec.set('description', latest.getString('description'))
        newRec.set('amount', latest.get('amount'))
        newRec.set('type', latest.getString('type'))
        newRec.set('category', latest.getString('category'))
        newRec.set('project_id', latest.getString('project_id'))
        newRec.set('responsible', latest.getString('responsible'))
        newRec.set('bank_account', latest.getString('bank_account'))
        newRec.set('status', 'Pendente')
        newRec.set('date', nextDate.toISOString().replace('T', ' '))
        newRec.set('is_recurring', true)
        newRec.set('frequency', freq)
        newRec.set('end_date', endDateStr || '')
        newRec.set('recurrence_group_id', groupId)

        $app.save(newRec)

        if (freq === 'Semanal') {
          nextDate.setDate(nextDate.getDate() + 7)
        } else if (freq === 'Mensal') {
          nextDate.setMonth(nextDate.getMonth() + 1)
        } else if (freq === 'Anual') {
          nextDate.setFullYear(nextDate.getFullYear() + 1)
        }
      }
    }
  } catch (err) {
    console.log('Error in financial recurrence cron: ' + err)
  }
})
