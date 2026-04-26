migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    if (!col.fields.getByName('is_approved')) {
      col.fields.add(new BoolField({ name: 'is_approved' }))
    }

    if (!col.fields.getByName('approved_by')) {
      col.fields.add(
        new RelationField({
          name: 'approved_by',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }

    app.save(col)

    app.db().newQuery('UPDATE financial_records SET is_approved = 1').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.removeByName('is_approved')
    col.fields.removeByName('approved_by')
    app.save(col)
  },
)
