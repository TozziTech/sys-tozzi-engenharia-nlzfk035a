migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.add(
      new JSONField({
        name: 'sub_disciplines',
        required: false,
        hidden: false,
        presentable: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.removeByName('sub_disciplines')
    app.save(col)
  },
)
