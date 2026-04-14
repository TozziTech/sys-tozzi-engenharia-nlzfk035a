migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('contacts')
    collection.fields.add(
      new BoolField({
        name: 'is_favorite',
        system: false,
        required: false,
      }),
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contacts')
    collection.fields.removeByName('is_favorite')
    app.save(collection)
  },
)
