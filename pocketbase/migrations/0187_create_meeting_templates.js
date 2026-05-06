migrate(
  (app) => {
    const col = new Collection({
      name: 'meeting_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      updateRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      deleteRule:
        "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'default_minutes', type: 'editor' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('meeting_templates')
    app.delete(col)
  },
)
