migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    col.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.updateRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    col.deleteRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    app.save(col)
  },
)
