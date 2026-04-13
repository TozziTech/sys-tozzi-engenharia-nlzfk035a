migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.add(
      new RelationField({
        name: 'responsible',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
        minSelect: 0,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.removeByName('responsible')
    app.save(col)
  },
)
