migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('generated_contracts')

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['Rascunho', 'Enviado para Assinatura', 'Assinado', 'Cancelado'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('external_id')) {
      col.fields.add(new TextField({ name: 'external_id' }))
    }
    if (!col.fields.getByName('signature_link')) {
      col.fields.add(new TextField({ name: 'signature_link' }))
    }
    if (!col.fields.getByName('signed_at')) {
      col.fields.add(new DateField({ name: 'signed_at' }))
    }

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE generated_contracts SET status = 'Rascunho' WHERE status IS NULL OR status = ''",
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('generated_contracts')
    col.fields.removeByName('status')
    col.fields.removeByName('external_id')
    col.fields.removeByName('signature_link')
    col.fields.removeByName('signed_at')
    app.save(col)
  },
)
