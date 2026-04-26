migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    const crCol = app.findCollectionByNameOrId('custom_roles')
    col.fields.add(
      new RelationField({
        name: 'custom_role',
        collectionId: crCol.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('custom_role')
    app.save(col)
  },
)
