migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const record = app.findAuthRecordByEmail('users', 'tozziengenharia@hotmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      app.save(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('tozziengenharia@hotmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      record.set('status', 'Ativo')
      app.save(record)
    }
  },
  (app) => {
    // Safe down migration: do nothing to prevent accidental admin deletion
  },
)
