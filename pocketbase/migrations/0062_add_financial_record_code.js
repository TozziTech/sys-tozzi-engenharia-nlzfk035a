migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')

    if (!collection.fields.getByName('code')) {
      collection.fields.add(new TextField({ name: 'code' }))
    }

    app.save(collection)

    // Migrate existing records to have a unique code
    try {
      // Using "1=1" instead of "" avoids panic during query parsing
      const records = app.findRecordsByFilter('financial_records', '1=1', 'created', 10000, 0)
      if (records) {
        for (let i = 0; i < records.length; i++) {
          if (!records[i].get('code')) {
            const num = String(i + 1).padStart(3, '0')
            const newCode = `FIN-${num}`
            // Use raw SQL to update, bypassing any model hooks that might panic
            app
              .db()
              .newQuery('UPDATE financial_records SET code = {:code} WHERE id = {:id}')
              .bind({ code: newCode, id: records[i].get('id') })
              .execute()
          }
        }
      }
    } catch (err) {
      console.log('Migration error in records update:', err)
    }

    // Add unique index
    collection.addIndex('idx_financial_records_code', true, 'code', '')
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')
    collection.removeIndex('idx_financial_records_code')
    collection.fields.removeByName('code')
    app.save(collection)
  },
)
