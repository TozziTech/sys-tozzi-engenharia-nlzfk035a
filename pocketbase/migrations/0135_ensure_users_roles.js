migrate(
  (app) => {
    const users = app.findRecordsByFilter('_pb_users_auth_', "role = '' || role = null")
    for (const user of users) {
      user.set('role', 'Visitante')
      app.saveNoValidate(user)
    }
  },
  (app) => {
    // Revert not necessary
  },
)
