migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    if (!col.fields.getByName('is_internal')) {
      col.fields.add(new BoolField({ name: 'is_internal' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    if (col.fields.getByName('is_internal')) {
      col.fields.removeByName('is_internal')
      app.save(col)
    }
  },
)
