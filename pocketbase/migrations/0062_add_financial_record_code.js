migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')

    if (!collection.fields.getByName('code')) {
      collection.fields.add(new TextField({ name: 'code' }))
    }

    app.save(collection)

    // Migrate existing records to have a unique code
    const records = app.findRecordsByFilter('financial_records', '1=1', 'created', 10000, 0)
    for (let i = 0; i < records.length; i++) {
      if (!records[i].get('code')) {
        const num = String(i + 1).padStart(3, '0')
        records[i].set('code', `FIN-${num}`)
        app.saveNoValidate(records[i])
      }
    }

    // Add unique index
    collection.addIndex('idx_financial_records_code', true, 'code', "code != ''")
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')
    collection.removeIndex('idx_financial_records_code')
    collection.fields.removeByName('code')
    app.save(collection)
  },
)
