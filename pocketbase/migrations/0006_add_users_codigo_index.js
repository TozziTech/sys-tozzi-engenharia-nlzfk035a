migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.addIndex('idx_users_codigo', false, 'codigo', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.removeIndex('idx_users_codigo')
    app.save(col)
  },
)
