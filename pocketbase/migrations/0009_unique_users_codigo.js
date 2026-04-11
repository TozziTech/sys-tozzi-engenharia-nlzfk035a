migrate(
  (app) => {
    // 1. Remove duplicates - keep the oldest record per codigo
    // We only run this on non-empty codigos to prevent deleting valid users missing their codigo
    app
      .db()
      .newQuery(`
    DELETE FROM users WHERE id NOT IN (
      SELECT MIN(id) FROM users GROUP BY codigo
    ) AND codigo IS NOT NULL AND codigo != ''
  `)
      .execute()

    // 2. Add the unique index, replacing any old regular index
    const col = app.findCollectionByNameOrId('users')
    col.removeIndex('idx_users_codigo')
    col.addIndex('idx_users_codigo_unique', true, 'codigo', "codigo != ''")
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.removeIndex('idx_users_codigo_unique')
    col.addIndex('idx_users_codigo', false, 'codigo', '')
    app.save(col)
  },
)
