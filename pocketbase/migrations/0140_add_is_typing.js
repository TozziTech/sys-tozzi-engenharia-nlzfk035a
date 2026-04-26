migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_presence')
    col.fields.add(new BoolField({ name: 'is_typing' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_presence')
    col.fields.removeByName('is_typing')
    app.save(col)
  },
)
