migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Pago'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.removeByName('status')
    app.save(col)
  },
)
