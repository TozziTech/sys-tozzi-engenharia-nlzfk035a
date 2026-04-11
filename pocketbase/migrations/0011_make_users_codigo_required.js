migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const field = collection.fields.getByName('codigo')
    if (field) {
      field.required = true
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const field = collection.fields.getByName('codigo')
    if (field) {
      field.required = false
      app.save(collection)
    }
  },
)
