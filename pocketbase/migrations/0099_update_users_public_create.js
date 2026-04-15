migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Allow public creation for Sign Up
    users.createRule = ''

    // Add 'Pendente' to status options
    const statusField = users.fields.getByName('status')
    if (statusField && !statusField.values.includes('Pendente')) {
      statusField.values.push('Pendente')
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = "@request.auth.id != ''"
    // Intentionally not removing 'Pendente' to avoid breaking existing records on rollback
    app.save(users)
  },
)
