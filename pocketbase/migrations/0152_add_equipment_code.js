migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipments')

    if (!col.fields.getByName('code')) {
      col.fields.add(new TextField({ name: 'code' }))
    }
    app.save(col)

    // Backfill
    const records = app.findRecordsByFilter('equipments', "code = ''", 'created', 10000, 0)

    const allRecords = app.findRecordsByFilter('equipments', "code ~ 'EQP-%'", '', 10000, 0)
    let maxNum = 0
    for (const r of allRecords) {
      const num = parseInt(r.getString('code').substring(4), 10)
      if (num > maxNum) maxNum = num
    }

    for (const record of records) {
      maxNum++
      record.set('code', 'EQP-' + String(maxNum).padStart(3, '0'))
      app.saveNoValidate(record)
    }

    col.addIndex('idx_equipments_code', true, 'code', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipments')
    col.removeIndex('idx_equipments_code')
    col.fields.removeByName('code')
    app.save(col)
  },
)
