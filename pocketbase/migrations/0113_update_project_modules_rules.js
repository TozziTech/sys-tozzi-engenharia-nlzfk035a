migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('project_modules')
    collection.createRule =
      "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'"
    collection.updateRule =
      "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'"
    collection.deleteRule =
      "@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto'"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('project_modules')
    collection.createRule = "@request.auth.id != ''"
    collection.updateRule = "@request.auth.id != ''"
    collection.deleteRule = "@request.auth.id != ''"
    app.save(collection)
  },
)
