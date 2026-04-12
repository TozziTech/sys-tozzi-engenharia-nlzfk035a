migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    if (!col.fields.getByName('ordem')) {
      col.fields.add(new NumberField({ name: 'ordem' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    if (col.fields.getByName('ordem')) {
      col.fields.removeByName('ordem')
      app.save(col)
    }
  },
)
