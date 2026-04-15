migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('notifications')

    if (!col.fields.getByName('is_important')) {
      col.fields.add(new BoolField({ name: 'is_important' }))
    }

    if (!col.fields.getByName('action_type')) {
      col.fields.add(new TextField({ name: 'action_type' }))
    }

    if (!col.fields.getByName('action_payload')) {
      col.fields.add(new TextField({ name: 'action_payload' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('notifications')
    col.fields.removeByName('is_important')
    col.fields.removeByName('action_type')
    col.fields.removeByName('action_payload')
    app.save(col)
  },
)
