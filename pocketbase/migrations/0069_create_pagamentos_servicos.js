migrate(
  (app) => {
    const collection = new Collection({
      name: 'pagamentos_servicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'servico_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('servicos_financeiros').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        { name: 'data_pagamento', type: 'date', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_pagamentos_servico_id ON pagamentos_servicos (servico_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pagamentos_servicos')
    app.delete(collection)
  },
)
