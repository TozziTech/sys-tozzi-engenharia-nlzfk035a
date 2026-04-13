migrate(
  (app) => {
    const collection = new Collection({
      name: 'report_schedules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'recipients', type: 'text', required: true },
        {
          name: 'frequency',
          type: 'select',
          required: true,
          values: ['Diário', 'Semanal', 'Mensal'],
          maxSelect: 1,
        },
        { name: 'active', type: 'bool' },
        { name: 'last_run', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('report_schedules'))
  },
)
