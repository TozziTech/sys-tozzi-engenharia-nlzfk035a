migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    if (!col.fields.getByName('is_suggested_video')) {
      col.fields.add(new BoolField({ name: 'is_suggested_video' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    if (col.fields.getByName('is_suggested_video')) {
      col.fields.removeByName('is_suggested_video')
    }
    app.save(col)
  },
)
