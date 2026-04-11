migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: ['Administrador', 'Gerente de Projeto', 'Projetista', 'Estagiário', 'Visitante'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('role')
    app.save(col)
  },
)
