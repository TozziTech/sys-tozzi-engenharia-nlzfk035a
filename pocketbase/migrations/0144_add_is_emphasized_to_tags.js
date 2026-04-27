migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tags')
    if (!col.fields.getByName('is_emphasized')) {
      col.fields.add(new BoolField({ name: 'is_emphasized' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tags')
    col.fields.removeByName('is_emphasized')
    app.save(col)
  },
)
