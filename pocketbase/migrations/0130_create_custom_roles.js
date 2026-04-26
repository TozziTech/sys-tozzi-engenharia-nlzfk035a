migrate(
  (app) => {
    const collection = new Collection({
      name: 'custom_roles',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'Administrador'",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'permissions', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('custom_roles')
    app.delete(collection)
  },
)
