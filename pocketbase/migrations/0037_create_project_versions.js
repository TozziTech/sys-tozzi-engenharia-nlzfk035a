migrate(
  (app) => {
    const projectModules = app.findCollectionByNameOrId('project_modules')

    const collection = new Collection({
      name: 'project_versions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'module',
          type: 'relation',
          required: true,
          collectionId: projectModules.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'version_label',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'file',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 52428800,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: ['CREATE INDEX idx_project_versions_module ON project_versions (module)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('project_versions')
    app.delete(collection)
  },
)
