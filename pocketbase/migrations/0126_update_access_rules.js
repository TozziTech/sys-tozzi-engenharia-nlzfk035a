migrate(
  (app) => {
    const upa = app.findCollectionByNameOrId('user_project_access')
    upa.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    upa.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    upa.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    app.save(upa)

    const ar = app.findCollectionByNameOrId('access_requests')
    ar.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'Administrador' || @request.auth.role = 'Gerente de Projeto')"
    app.save(ar)
  },
  (app) => {
    const upa = app.findCollectionByNameOrId('user_project_access')
    upa.updateRule = "@request.auth.role = 'Administrador'"
    upa.deleteRule = "@request.auth.role = 'Administrador'"
    upa.createRule = "@request.auth.role = 'Administrador'"
    app.save(upa)

    const ar = app.findCollectionByNameOrId('access_requests')
    ar.updateRule = "@request.auth.role = 'Administrador'"
    app.save(ar)
  },
)
