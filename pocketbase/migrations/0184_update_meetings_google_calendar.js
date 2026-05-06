migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('meetings')
    if (!col.fields.getByName('google_event_id')) {
      col.fields.add(new TextField({ name: 'google_event_id' }))
    }
    if (!col.fields.getByName('meet_link')) {
      col.fields.add(new URLField({ name: 'meet_link', exceptDomains: [], onlyDomains: [] }))
    }
    if (!col.fields.getByName('description')) {
      col.fields.add(new TextField({ name: 'description' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('meetings')
    col.fields.removeByName('google_event_id')
    col.fields.removeByName('meet_link')
    col.fields.removeByName('description')
    app.save(col)
  },
)
