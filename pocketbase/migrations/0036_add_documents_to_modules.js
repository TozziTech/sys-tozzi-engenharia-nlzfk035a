migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    if (!col.fields.getByName('documents')) {
      col.fields.add(
        new FileField({
          name: 'documents',
          maxSelect: 99,
          maxSize: 52428800,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.removeByName('documents')
    app.save(col)
  },
)
