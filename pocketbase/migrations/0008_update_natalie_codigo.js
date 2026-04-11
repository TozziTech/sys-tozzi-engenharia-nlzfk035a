migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('users', "name ~ 'natalie'", '', 1, 0)
      if (records.length > 0) {
        const natalie = records[0]
        natalie.set('codigo', 'PER-003')
        app.save(natalie)
      }
    } catch (err) {
      console.log('Migration 0008 error or Natalie not found:', err)
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'users',
        "codigo = 'PER-003' && name ~ 'natalie'",
        '',
        1,
        0,
      )
      if (records.length > 0) {
        const natalie = records[0]
        natalie.set('codigo', 'PER-001')
        app.save(natalie)
      }
    } catch (err) {
      console.log('Migration 0008 rollback error:', err)
    }
  },
)
