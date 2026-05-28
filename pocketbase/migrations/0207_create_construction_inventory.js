migrate(
  (app) => {
    const collection = new Collection({
      name: 'construction_inventory',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')",
      fields: [
        {
          name: 'project',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('projects').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'item_name', type: 'text', required: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_construction_inventory_project ON construction_inventory (project)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('construction_inventory')
    app.delete(collection)
  },
)
