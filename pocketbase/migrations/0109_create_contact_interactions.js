migrate(
  (app) => {
    const collection = new Collection({
      name: 'contact_interactions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'contact',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('contacts').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'interaction_date', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contact_interactions_contact ON contact_interactions (contact)',
        'CREATE INDEX idx_contact_interactions_date ON contact_interactions (interaction_date DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contact_interactions')
    app.delete(collection)
  },
)
