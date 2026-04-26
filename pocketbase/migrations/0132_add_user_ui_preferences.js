migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.add(new JSONField({ name: 'ui_preferences' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('ui_preferences')
    app.save(col)
  },
)
