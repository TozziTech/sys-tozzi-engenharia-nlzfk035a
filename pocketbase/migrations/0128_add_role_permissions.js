migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('role_permissions')) {
      col.fields.add(new JSONField({ name: 'role_permissions' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (col.fields.getByName('role_permissions')) {
      col.fields.removeByName('role_permissions')
      app.save(col)
    }
  },
)
