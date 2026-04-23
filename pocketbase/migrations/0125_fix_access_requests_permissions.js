migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('access_requests')

    collection.createRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('access_requests')

    collection.createRule = "@request.auth.id != '' && user = @request.auth.id"

    app.save(collection)
  },
)
