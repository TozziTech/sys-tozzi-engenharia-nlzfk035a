migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')
    collection.fields.add(
      new FileField({
        name: 'attachment',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('financial_records')
    collection.fields.removeByName('attachment')
    app.save(collection)
  },
)
