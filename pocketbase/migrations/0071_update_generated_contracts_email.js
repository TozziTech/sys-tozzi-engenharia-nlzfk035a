migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('generated_contracts')
    if (!col.fields.getByName('client_email')) {
      col.fields.add(new EmailField({ name: 'client_email' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('generated_contracts')
    col.fields.removeByName('client_email')
    app.save(col)
  },
)
