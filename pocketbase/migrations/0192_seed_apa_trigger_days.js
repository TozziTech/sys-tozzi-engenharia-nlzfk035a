migrate(
  (app) => {
    const records = app.findRecordsByFilter('company_settings', '1=1', '-created', 1, 0)
    if (records.length > 0) {
      const record = records[0]
      if (!record.get('apa_trigger_days')) {
        record.set('apa_trigger_days', 7)
        app.save(record)
      }
    }
  },
  (app) => {},
)
