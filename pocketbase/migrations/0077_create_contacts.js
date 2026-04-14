migrate(
  (app) => {
    const collection = new Collection({
      name: 'contacts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'company', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['Cliente', 'Fornecedor', 'Parceiro'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('contacts')
      app.delete(collection)
    } catch (_) {}
  },
)
