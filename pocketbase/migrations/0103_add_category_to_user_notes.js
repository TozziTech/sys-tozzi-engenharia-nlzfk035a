migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')
    if (!col.fields.getByName('category')) {
      col.fields.add(new TextField({ name: 'category' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')
    col.fields.removeByName('category')
    app.save(col)
  },
)
