migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    if (!col.fields.getByName('bank_account')) {
      col.fields.add(
        new RelationField({
          name: 'bank_account',
          collectionId: app.findCollectionByNameOrId('bank_accounts').id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    if (col.fields.getByName('bank_account')) {
      col.fields.removeByName('bank_account')
      app.save(col)
    }
  },
)
