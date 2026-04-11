migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.add(new TextField({ name: 'codigo' }))
    users.fields.add(new TextField({ name: 'formacao' }))
    users.fields.add(new TextField({ name: 'logradouro' }))
    users.fields.add(new TextField({ name: 'numero' }))
    users.fields.add(new TextField({ name: 'bairro' }))
    users.fields.add(new TextField({ name: 'cidade' }))
    users.fields.add(new TextField({ name: 'uf' }))
    users.fields.add(new TextField({ name: 'cep' }))

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    users.fields.removeByName('codigo')
    users.fields.removeByName('formacao')
    users.fields.removeByName('logradouro')
    users.fields.removeByName('numero')
    users.fields.removeByName('bairro')
    users.fields.removeByName('cidade')
    users.fields.removeByName('uf')
    users.fields.removeByName('cep')

    app.save(users)
  },
)
