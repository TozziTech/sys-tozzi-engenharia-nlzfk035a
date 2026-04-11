migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'tozziengenharia@hotmail.com')

      // Update the record with proper credentials and missing required fields
      record.setPassword('Skip@Pass')

      if (!record.get('codigo')) {
        record.set('codigo', 'ADM-001')
      }

      record.set('status', 'Ativo')
      record.set('role', 'Administrador')
      record.setVerified(true)

      app.save(record)
    } catch (_) {
      // Record not found, let's create it properly
      const users = app.findCollectionByNameOrId('users')
      const record = new Record(users)
      record.setEmail('tozziengenharia@hotmail.com')
      record.setPassword('Skip@Pass')
      record.set('codigo', 'ADM-001')
      record.set('status', 'Ativo')
      record.set('role', 'Administrador')
      record.set('name', 'Admin')
      record.setVerified(true)

      app.save(record)
    }
  },
  (app) => {
    // Revert is not strictly necessary for this seed/fix migration
  },
)
