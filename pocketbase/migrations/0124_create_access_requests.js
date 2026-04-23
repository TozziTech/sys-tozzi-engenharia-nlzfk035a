migrate(
  (app) => {
    const collection = new Collection({
      name: 'access_requests',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'Administrador')",
      viewRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'Administrador')",
      createRule: "@request.auth.id != '' && user = @request.auth.id",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'project',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('projects').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'requested_level',
          type: 'select',
          required: true,
          values: ['Leitura', 'Edição'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Pendente', 'Aprovado', 'Negado'],
          maxSelect: 1,
        },
        { name: 'admin_notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_access_requests_user ON access_requests (user)',
        'CREATE INDEX idx_access_requests_project ON access_requests (project)',
        'CREATE INDEX idx_access_requests_status ON access_requests (status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('access_requests')
    app.delete(collection)
  },
)
