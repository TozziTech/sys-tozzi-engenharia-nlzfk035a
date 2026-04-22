migrate(
  (app) => {
    const clientsCol = app.findCollectionByNameOrId('clients')

    const collection = new Collection({
      name: 'documentos_clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          required: true,
          collectionId: clientsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'arquivo', type: 'file', required: true, maxSelect: 1, maxSize: 52428800 },
        {
          name: 'categoria',
          type: 'select',
          required: false,
          values: ['Contrato', 'Identificação', 'Financeiro', 'Outros'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_doc_cli_cliente ON documentos_clientes (cliente)'],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('documentos_clientes')
    app.delete(collection)
  },
)
