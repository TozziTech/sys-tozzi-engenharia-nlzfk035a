migrate(
  (app) => {
    const collection = new Collection({
      name: 'tarefas_hierarquicas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'projeto_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('projects').id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'concluida', type: 'bool' },
        { name: 'dados_customizados', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    const parentField = new RelationField({
      name: 'parent_id',
      collectionId: collection.id,
      cascadeDelete: true,
      maxSelect: 1,
    })
    collection.fields.add(parentField)
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('tarefas_hierarquicas')
    app.delete(collection)
  },
)
