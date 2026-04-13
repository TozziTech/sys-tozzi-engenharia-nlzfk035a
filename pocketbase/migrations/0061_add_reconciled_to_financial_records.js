migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.add(new BoolField({ name: 'reconciled' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.removeByName('reconciled')
    app.save(col)
  },
)
