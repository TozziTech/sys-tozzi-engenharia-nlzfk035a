migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    if (!col.fields.getByName('deadline_days')) {
      col.fields.add(new NumberField({ name: 'deadline_days', min: 0 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.removeByName('deadline_days')
    app.save(col)
  },
)
