migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')
    if (!col.fields.getByName('rich_content')) {
      col.fields.add(new EditorField({ name: 'rich_content' }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')
    if (col.fields.getByName('rich_content')) {
      col.fields.removeByName('rich_content')
      app.save(col)
    }
  },
)
