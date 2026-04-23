migrate(
  (app) => {
    const collection = new Collection({
      name: 'user_project_access',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'Administrador'",
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
          name: 'access_level',
          type: 'select',
          required: true,
          values: ['Leitura', 'Edição'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_upa_user ON user_project_access (user)',
        'CREATE INDEX idx_upa_project ON user_project_access (project)',
        'CREATE UNIQUE INDEX idx_upa_user_project ON user_project_access (user, project)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('user_project_access')
    app.delete(collection)
  },
)
