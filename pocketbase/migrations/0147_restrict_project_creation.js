migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.createRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    app.save(col)
  },
)
