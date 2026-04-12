migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.add(
      new RelationField({
        name: 'responsible',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    col.fields.removeByName('responsible')
    app.save(col)
  },
)
