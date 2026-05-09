migrate(
  (app) => {
    let user
    try {
      user = app.findFirstRecordByData('users', 'codigo', 'TZZ-001')
    } catch (_) {
      return // User not found, exit gracefully
    }

    const codigos = ['SER-039', 'SER-040']
    for (const codigo of codigos) {
      try {
        const record = app.findFirstRecordByData('servicos_financeiros', 'codigo', codigo)
        if (record.get('user_id') !== user.id) {
          record.set('user_id', user.id)
          app.save(record)
        }
      } catch (_) {
        // Record not found, continue to the next one
      }
    }
  },
  (app) => {
    // Cannot revert deterministically without knowing the previous owner
  },
)
