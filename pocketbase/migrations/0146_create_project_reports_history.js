migrate(
  (app) => {
    const collection = new Collection({
      name: 'project_reports_history',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'project',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('projects').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'snapshot_data', type: 'json', required: false },
        { name: 'total_progress', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_project_reports_history_project ON project_reports_history (project)',
        'CREATE INDEX idx_project_reports_history_created ON project_reports_history (created)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('project_reports_history')
    app.delete(collection)
  },
)
