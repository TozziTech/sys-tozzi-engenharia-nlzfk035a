migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_documents')

    if (!col.fields.getByName('is_urgent')) {
      col.fields.add(new BoolField({ name: 'is_urgent' }))
    }

    if (!col.fields.getByName('feedback')) {
      col.fields.add(new TextField({ name: 'feedback' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_documents')
    col.fields.removeByName('is_urgent')
    col.fields.removeByName('feedback')
    app.save(col)
  },
)
