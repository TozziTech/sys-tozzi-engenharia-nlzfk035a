migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Pago', 'Atrasado', 'Cancelado'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('attachment')) {
      col.fields.add(
        new FileField({
          name: 'attachment',
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    if (col.fields.getByName('status')) {
      col.fields.removeByName('status')
    }
    if (col.fields.getByName('attachment')) {
      col.fields.removeByName('attachment')
    }

    app.save(col)
  },
)
