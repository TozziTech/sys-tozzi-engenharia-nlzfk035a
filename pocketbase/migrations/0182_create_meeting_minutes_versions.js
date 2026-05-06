migrate(
  (app) => {
    const meetingsId = app.findCollectionByNameOrId('meetings').id
    const usersId = '_pb_users_auth_'

    const collection = new Collection({
      name: 'meeting_minutes_versions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')",
      updateRule: "@request.auth.role = 'Administrador'",
      deleteRule: "@request.auth.role = 'Administrador'",
      fields: [
        {
          name: 'meeting',
          type: 'relation',
          required: true,
          collectionId: meetingsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'content', type: 'editor' },
        { name: 'version_label', type: 'text', required: true },
        { name: 'author', type: 'relation', required: true, collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_meeting_minutes_versions_meeting ON meeting_minutes_versions (meeting)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('meeting_minutes_versions')
    app.delete(collection)
  },
)
