migrate(
  (app) => {
    const templates = new Collection({
      name: 'checklist_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'service_type',
          type: 'select',
          values: ['estrutural', 'hidrossanitário', 'elétrico', 'diagnóstico', 'outro'],
          maxSelect: 1,
        },
        { name: 'items', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(templates)

    const executions = new Collection({
      name: 'checklist_executions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'template', type: 'relation', collectionId: templates.id, maxSelect: 1 },
        { name: 'inspection_date', type: 'date' },
        { name: 'location', type: 'text' },
        { name: 'responses', type: 'json' },
        { name: 'compliance_score', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(executions)
  },
  (app) => {
    const e = app.findCollectionByNameOrId('checklist_executions')
    app.delete(e)
    const t = app.findCollectionByNameOrId('checklist_templates')
    app.delete(t)
  },
)
