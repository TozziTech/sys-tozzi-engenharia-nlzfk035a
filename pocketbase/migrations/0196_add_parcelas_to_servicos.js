migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('servicos_financeiros')
    col.fields.add(new JSONField({ name: 'parcelas' }))
    app.save(col)

    const servicos = app.findRecordsByFilter('servicos_financeiros', '1=1', '', 10000, 0)
    for (const s of servicos) {
      try {
        const pagamentos = app.findRecordsByFilter(
          'pagamentos_servicos',
          `servico_id = "${s.id}"`,
          'data_vencimento',
          10000,
          0,
        )
        const parcelas = []
        for (const p of pagamentos) {
          parcelas.push({
            id: p.id,
            valor: p.getFloat('valor'),
            data_vencimento: p.getString('data_vencimento')?.substring(0, 10) || null,
            data_pagamento: p.getString('data_pagamento')?.substring(0, 10) || null,
            status: p.getString('status') || 'Pendente',
            descricao: p.getString('descricao') || '',
          })
        }
        if (parcelas.length > 0) {
          s.set('parcelas', parcelas)
          app.saveNoValidate(s)
        }
      } catch (_) {}
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('servicos_financeiros')
    col.fields.removeByName('parcelas')
    app.save(col)
  },
)
