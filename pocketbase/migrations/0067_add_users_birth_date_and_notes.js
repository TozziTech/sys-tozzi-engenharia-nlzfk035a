migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.add(new DateField({ name: 'birth_date' }))
    col.fields.add(new TextField({ name: 'notes' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('birth_date')
    col.fields.removeByName('notes')
    app.save(col)
  },
)
