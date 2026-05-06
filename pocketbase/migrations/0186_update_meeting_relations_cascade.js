migrate(
  (app) => {
    const collections = [
      'meeting_agenda_items',
      'meeting_documents',
      'meeting_actions',
      'meeting_minutes_versions',
    ]

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      const field = col.fields.getByName('meeting')
      if (field) {
        field.cascadeDelete = true
        app.save(col)
      }
    }
  },
  (app) => {
    const collections = [
      'meeting_agenda_items',
      'meeting_documents',
      'meeting_actions',
      'meeting_minutes_versions',
    ]

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      const field = col.fields.getByName('meeting')
      if (field) {
        field.cascadeDelete = false
        app.save(col)
      }
    }
  },
)
