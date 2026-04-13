migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('documentos_link')) {
      users.fields.add(
        new TextField({
          name: 'documentos_link',
        }),
      )
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('documentos_link')
    app.save(users)
  },
)
