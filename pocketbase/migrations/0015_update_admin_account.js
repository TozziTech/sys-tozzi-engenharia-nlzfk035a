migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'tozziengenharia@hotmail.com')
      record.set('codigo', 'ADM-001')
      record.set('role', 'Administrador')
      record.set('status', 'Ativo')
      app.save(record)
    } catch (_) {
      // Record does not exist, skip update
    }
  },
  (app) => {
    // No revert needed
  },
)
