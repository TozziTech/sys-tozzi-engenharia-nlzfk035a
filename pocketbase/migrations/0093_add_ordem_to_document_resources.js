migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    col.fields.add(new NumberField({ name: 'ordem' }))
    app.save(col)

    const records = app.findRecordsByFilter('document_resources', '1=1', 'created', 10000, 0)
    let order = 1
    for (const record of records) {
      record.set('ordem', order++)
      app.saveNoValidate(record)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    col.fields.removeByName('ordem')
    app.save(col)
  },
)
