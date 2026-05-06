migrate(
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')
    const statusField = meetings.fields.getByName('status')
    if (statusField && statusField.type === 'select') {
      statusField.values = ['Pendente', 'Em Andamento', 'Realizada', 'Cancelada']
    }

    if (!meetings.fields.getByName('minutes')) {
      meetings.fields.add(new EditorField({ name: 'minutes' }))
    }

    if (!meetings.fields.getByName('attendance')) {
      meetings.fields.add(new JSONField({ name: 'attendance' }))
    }

    app.save(meetings)

    if (!app.hasTable('meeting_actions')) {
      const actions = new Collection({
        name: 'meeting_actions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'meeting',
            type: 'relation',
            required: true,
            collectionId: meetings.id,
            maxSelect: 1,
          },
          { name: 'description', type: 'text', required: true },
          {
            name: 'responsible',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            maxSelect: 1,
          },
          { name: 'due_date', type: 'date' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['Pendente', 'Em Progresso', 'Concluído'],
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(actions)
    }
  },
  (app) => {
    try {
      const actions = app.findCollectionByNameOrId('meeting_actions')
      app.delete(actions)
    } catch (_) {}

    try {
      const meetings = app.findCollectionByNameOrId('meetings')
      meetings.fields.removeByName('minutes')
      meetings.fields.removeByName('attendance')
      const statusField = meetings.fields.getByName('status')
      if (statusField) {
        statusField.values = ['Pendente', 'Realizada', 'Cancelada']
      }
      app.save(meetings)
    } catch (_) {}
  },
)
