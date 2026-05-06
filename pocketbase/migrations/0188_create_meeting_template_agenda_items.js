migrate(
  (app) => {
    const templatesCol = app.findCollectionByNameOrId('meeting_templates')
    const col = new Collection({
      name: 'meeting_template_agenda_items',
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
        {
          name: 'template',
          type: 'relation',
          required: true,
          collectionId: templatesCol.id,
          maxSelect: 1,
        },
        { name: 'topic', type: 'text', required: true },
        { name: 'estimated_time', type: 'number' },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_meeting_template_agenda_items_template ON meeting_template_agenda_items (template)',
      ],
    })
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('meeting_template_agenda_items')
    app.delete(col)
  },
)
