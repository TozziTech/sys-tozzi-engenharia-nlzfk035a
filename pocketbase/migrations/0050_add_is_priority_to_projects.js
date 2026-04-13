migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    if (!col.fields.getByName('is_priority')) {
      col.fields.add(new BoolField({ name: 'is_priority' }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    if (col.fields.getByName('is_priority')) {
      col.fields.removeByName('is_priority')
      app.save(col)
    }
  },
)
