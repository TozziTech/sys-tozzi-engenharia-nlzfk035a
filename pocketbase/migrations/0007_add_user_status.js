migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['Ativo', 'Inativo', 'Em Férias'],
          maxSelect: 1,
        }),
      )
    }
    col.addIndex('idx_users_status', false, 'status', '')
    app.save(col)

    // Define um valor padrão "Ativo" para os usuários já existentes na base
    app
      .db()
      .newQuery("UPDATE users SET status = 'Ativo' WHERE status IS NULL OR status = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('status')
    col.removeIndex('idx_users_status')
    app.save(col)
  },
)
