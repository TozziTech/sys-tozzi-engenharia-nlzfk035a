migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('bank_accounts')
    col.fields.add(new TextField({ name: 'code' }))
    app.save(col)

    const records = app.findRecordsByFilter('bank_accounts', '1=1', 'created', 10000, 0)
    for (let i = 0; i < records.length; i++) {
      records[i].set('code', `CB-${String(i + 1).padStart(3, '0')}`)
      app.saveNoValidate(records[i])
    }

    col.addIndex('idx_bank_accounts_code', true, 'code', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('bank_accounts')
    col.removeIndex('idx_bank_accounts_code')
    col.fields.removeByName('code')
    app.save(col)
  },
)
