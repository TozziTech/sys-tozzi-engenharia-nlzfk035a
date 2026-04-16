migrate(
  (app) => {
    try {
      const samuel = app.findFirstRecordByFilter('users', "name ~ 'Samuel'")
      if (samuel) {
        samuel.set('codigo', 'ADM-002')
        app.save(samuel)
      }
    } catch (_) {
      // Samuel record not found, skip
    }

    try {
      const natalie = app.findFirstRecordByFilter('users', "name ~ 'Natalie'")
      if (natalie) {
        natalie.set('codigo', 'TZZ-001')
        app.save(natalie)
      }
    } catch (_) {
      // Natalie record not found, skip
    }
  },
  (app) => {
    // Down migration left intentionally blank because we do not know
    // the previous values to reliably revert them.
  },
)
