migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.updateRule = "@request.auth.id = id || @request.auth.role = 'Administrador'"
    col.deleteRule = "@request.auth.role = 'Administrador'"

    if (!col.fields.getByName('phone')) {
      col.fields.add(new TextField({ name: 'phone' }))
    }
    if (!col.fields.getByName('altPhone')) {
      col.fields.add(new TextField({ name: 'altPhone' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"

    if (col.fields.getByName('phone')) {
      col.fields.removeByName('phone')
    }
    if (col.fields.getByName('altPhone')) {
      col.fields.removeByName('altPhone')
    }

    app.save(col)
  },
)
