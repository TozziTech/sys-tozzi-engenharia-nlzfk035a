migrate(
  (app) => {
    const modules = app.findRecordsByFilter('project_modules', '1=1', '', 100, 0)
    const users = app.findRecordsByFilter(
      '_pb_users_auth_',
      "role = 'Projetista' || role = 'Gerente de Projeto'",
      '',
      10,
      0,
    )

    if (users.length > 0 && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i]
        const user = users[i % users.length]
        mod.set('responsible', user.id)
        app.saveNoValidate(mod)
      }
    }
  },
  (app) => {
    // Revert not strictly necessary for seed data
  },
)
