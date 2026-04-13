migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')

    let changed = false

    if (!collection.fields.getByName('attachment')) {
      collection.fields.add(
        new FileField({
          name: 'attachment',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        }),
      )
      changed = true
    }

    if (!collection.fields.getByName('status')) {
      collection.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Pago'],
          maxSelect: 1,
        }),
      )
      changed = true
    }

    if (changed) {
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')

    let changed = false

    if (collection.fields.getByName('attachment')) {
      collection.fields.removeByName('attachment')
      changed = true
    }

    if (collection.fields.getByName('status')) {
      collection.fields.removeByName('status')
      changed = true
    }

    if (changed) {
      app.save(collection)
    }
  },
)
