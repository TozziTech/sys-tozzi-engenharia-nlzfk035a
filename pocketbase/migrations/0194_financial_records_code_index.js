migrate(
  (app) => {
    // 1. Assign unique codes to records that don't have one
    let maxNum = 0
    try {
      const result = new DynamicModel({ maxNum: 0 })
      app
        .db()
        .newQuery(
          "SELECT IFNULL(MAX(CAST(SUBSTR(code, 5) AS INTEGER)), 0) as maxNum FROM financial_records WHERE code LIKE 'FIN-%'",
        )
        .one(result)
      maxNum = parseInt(result.maxNum, 10) || 0
    } catch (err) {
      console.log('Error finding max code during migration', err)
    }

    const recordsWithoutCode = app.findRecordsByFilter(
      'financial_records',
      "code = '' || code = null",
      '',
      10000,
      0,
    )
    for (const record of recordsWithoutCode) {
      maxNum++
      record.set('code', 'FIN-' + String(maxNum).padStart(4, '0'))
      app.saveNoValidate(record)
    }

    // 2. Make amount required
    const col = app.findCollectionByNameOrId('financial_records')
    const amountField = col.fields.getByName('amount')
    if (amountField) {
      amountField.required = true
    }

    // 3. Ensure unique index on code
    try {
      col.removeIndex('idx_financial_records_code')
    } catch (_) {}

    col.addIndex('idx_financial_records_code_unique', true, 'code', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    const amountField = col.fields.getByName('amount')
    if (amountField) {
      amountField.required = false
    }
    col.removeIndex('idx_financial_records_code_unique')
    app.save(col)
  },
)
