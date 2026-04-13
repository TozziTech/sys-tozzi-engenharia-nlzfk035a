migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_categories')
    if (!collection.fields.getByName('monthly_limit')) {
      collection.fields.add(new NumberField({ name: 'monthly_limit' }))
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_categories')
    collection.fields.removeByName('monthly_limit')
    app.save(collection)
  },
)
