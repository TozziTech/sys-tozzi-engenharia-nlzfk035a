migrate(
  (app) => {
    const listRule = "@request.auth.id != ''"
    const writeRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"

    const meetings = new Collection({
      name: 'meetings',
      type: 'base',
      listRule: listRule,
      viewRule: listRule,
      createRule: writeRule,
      updateRule: writeRule,
      deleteRule: writeRule,
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'project',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('projects').id,
          cascadeDelete: false,
        },
        { name: 'date_time', type: 'date', required: true },
        { name: 'duration', type: 'number', required: true },
        { name: 'participants', type: 'json' },
        { name: 'status', type: 'select', values: ['Pendente', 'Realizada', 'Cancelada'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(meetings)

    const meeting_agenda_items = new Collection({
      name: 'meeting_agenda_items',
      type: 'base',
      listRule: listRule,
      viewRule: listRule,
      createRule: writeRule,
      updateRule: writeRule,
      deleteRule: writeRule,
      fields: [
        {
          name: 'meeting',
          type: 'relation',
          required: true,
          collectionId: meetings.id,
          cascadeDelete: true,
        },
        { name: 'topic', type: 'text', required: true },
        { name: 'estimated_time', type: 'number' },
        { name: 'responsible', type: 'relation', collectionId: '_pb_users_auth_' },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(meeting_agenda_items)

    const meeting_documents = new Collection({
      name: 'meeting_documents',
      type: 'base',
      listRule: listRule,
      viewRule: listRule,
      createRule: writeRule,
      updateRule: writeRule,
      deleteRule: writeRule,
      fields: [
        {
          name: 'meeting',
          type: 'relation',
          required: true,
          collectionId: meetings.id,
          cascadeDelete: true,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'file', type: 'file', maxSelect: 1, maxSize: 52428800 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(meeting_documents)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('meeting_documents'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('meeting_agenda_items'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('meetings'))
    } catch (_) {}
  },
)
