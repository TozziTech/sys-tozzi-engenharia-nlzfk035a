migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new RelationField({
        name: 'assigned_projects',
        collectionId: app.findCollectionByNameOrId('projects').id,
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 999,
      }),
    )
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('assigned_projects')
    app.save(users)
  },
)
