migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    if (!col.fields.getByName('is_archived')) {
      col.fields.add(new BoolField({ name: 'is_archived' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.fields.removeByName('is_archived')
    app.save(col)
  },
)
