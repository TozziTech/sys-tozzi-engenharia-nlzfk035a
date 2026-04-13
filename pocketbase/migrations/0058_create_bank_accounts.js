migrate(
  (app) => {
    const collection = new Collection({
      name: 'bank_accounts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'bank_name', type: 'text', required: true },
        { name: 'agency', type: 'text' },
        { name: 'account_number', type: 'text' },
        { name: 'balance', type: 'number' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Corrente', 'Poupança', 'Investimento'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('bank_accounts')
    app.delete(collection)
  },
)
