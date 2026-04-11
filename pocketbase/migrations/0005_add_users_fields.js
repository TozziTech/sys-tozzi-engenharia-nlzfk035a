migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('crea')) {
      users.fields.add(new TextField({ name: 'crea' }))
    }
    if (!users.fields.getByName('cpf')) {
      users.fields.add(new TextField({ name: 'cpf' }))
    }
    if (!users.fields.getByName('rg')) {
      users.fields.add(new TextField({ name: 'rg' }))
    }

    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id != ''"
    users.updateRule = "@request.auth.id != ''"
    users.deleteRule = "@request.auth.id != ''"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.removeByName('crea')
    users.fields.removeByName('cpf')
    users.fields.removeByName('rg')

    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'

    app.save(users)
  },
)
