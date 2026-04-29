migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pagamentos_servicos')

    const dataPagamento = col.fields.getByName('data_pagamento')
    if (dataPagamento) {
      dataPagamento.required = false
    }

    if (!col.fields.getByName('data_vencimento')) {
      col.fields.add(
        new DateField({
          name: 'data_vencimento',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Pago'],
          required: false,
        }),
      )
    }

    app.save(col)

    app
      .db()
      .newQuery(`
    UPDATE pagamentos_servicos
    SET status = 'Pago', data_vencimento = data_pagamento
    WHERE status = '' OR status IS NULL
  `)
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pagamentos_servicos')

    const dataPagamento = col.fields.getByName('data_pagamento')
    if (dataPagamento) {
      dataPagamento.required = true
    }

    col.fields.removeByName('data_vencimento')
    col.fields.removeByName('status')

    app.save(col)
  },
)
