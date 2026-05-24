migrate(
  (app) => {
    const records = app.findRecordsByFilter('user_notes', "content != ''", '', 100000, 0)
    for (const record of records) {
      const existingRich = record.get('rich_content')
      if (!existingRich || existingRich.trim() === '') {
        const content = record.get('content') || ''
        const htmlContent = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .split('\n')
          .map((line) => (line.trim() === '' ? '<br>' : `<p>${line}</p>`))
          .join('')
        record.set('rich_content', htmlContent)
        app.saveNoValidate(record)
      }
    }
  },
  (app) => {
    // Revert not necessary
  },
)
