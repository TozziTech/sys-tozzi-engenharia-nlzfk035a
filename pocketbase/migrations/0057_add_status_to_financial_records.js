migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')

    if (!collection.fields.getByName('status')) {
      collection.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Pago'],
          maxSelect: 1,
        }),
      )
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')

    if (collection.fields.getByName('status')) {
      collection.fields.removeByName('status')
      app.save(collection)
    }
  },
)
