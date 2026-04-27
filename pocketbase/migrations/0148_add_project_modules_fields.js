migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.add(new TextField({ name: 'edificacao' }))
    col.fields.add(new DateField({ name: 'start_date' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.removeByName('edificacao')
    col.fields.removeByName('start_date')
    app.save(col)
  },
)
