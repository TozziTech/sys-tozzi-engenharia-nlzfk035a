migrate(
  (app) => {
    const collection = new Collection({
      name: 'project_modules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'project',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('projects').id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em Andamento', 'Concluído', 'Pausado'],
          maxSelect: 1,
        },
        { name: 'progress', type: 'number', min: 0, max: 100 },
        { name: 'deadline', type: 'date' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_project_modules_project ON project_modules (project)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('project_modules')
    app.delete(collection)
  },
)
