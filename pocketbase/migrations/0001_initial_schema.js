migrate(
  (app) => {
    const equipments = new Collection({
      name: 'equipments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'category', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'responsible', type: 'text' },
        { name: 'return_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(equipments)

    const projects = new Collection({
      name: 'projects',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'client', type: 'text' },
        { name: 'discipline', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'progress', type: 'number' },
        { name: 'engineer', type: 'text' },
        { name: 'budget', type: 'number' },
        { name: 'spent', type: 'number' },
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(projects)

    const tasks = new Collection({
      name: 'tasks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'status', type: 'text' },
        { name: 'project', type: 'relation', collectionId: projects.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tasks)

    const quotes = new Collection({
      name: 'quotes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'client_name', type: 'text', required: true },
        { name: 'client_email', type: 'text' },
        { name: 'project_name', type: 'text' },
        { name: 'items', type: 'json' },
        { name: 'total_amount', type: 'number' },
        { name: 'status', type: 'text' },
        { name: 'date', type: 'text' },
        { name: 'deadline', type: 'date' },
        { name: 'payment_method', type: 'text' },
        { name: 'included_items', type: 'text' },
        { name: 'not_included_items', type: 'text' },
        { name: 'observations', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(quotes)

    const financial_records = new Collection({
      name: 'financial_records',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'type', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'project_id', type: 'text' },
        { name: 'date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(financial_records)

    const company_settings = new Collection({
      name: 'company_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'company_name', type: 'text' },
        { name: 'cnpj', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'phone', type: 'text' },
        {
          name: 'logo',
          type: 'file',
          maxSelect: 1,
          mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(company_settings)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('company_settings'))
    app.delete(app.findCollectionByNameOrId('financial_records'))
    app.delete(app.findCollectionByNameOrId('quotes'))
    app.delete(app.findCollectionByNameOrId('tasks'))
    app.delete(app.findCollectionByNameOrId('projects'))
    app.delete(app.findCollectionByNameOrId('equipments'))
  },
)
