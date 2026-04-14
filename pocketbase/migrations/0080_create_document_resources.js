migrate(
  (app) => {
    const collection = new Collection({
      name: 'document_resources',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'Administrador'",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['Biblioteca', 'POPs', 'Projetos Base', 'Documentos Modelos', 'Cursos'],
          maxSelect: 1,
        },
        { name: 'url', type: 'url', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('document_resources')
    app.delete(collection)
  },
)
