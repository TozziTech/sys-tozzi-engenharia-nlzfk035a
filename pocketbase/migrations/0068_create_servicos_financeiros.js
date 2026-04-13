migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      name: 'servicos_financeiros',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'codigo', type: 'text', required: true },
        { name: 'projeto_servico', type: 'text', required: true },
        { name: 'observacoes', type: 'text' },
        { name: 'cliente', type: 'text' },
        { name: 'data_inicio', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'],
          maxSelect: 1,
        },
        { name: 'valor_total', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_servicos_financeiros_user ON servicos_financeiros (user_id)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('servicos_financeiros')
    app.delete(collection)
  },
)
