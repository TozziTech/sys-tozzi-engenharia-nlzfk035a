migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    const tagsCollection = app.findCollectionByNameOrId('tags')

    if (!col.fields.getByName('tags')) {
      col.fields.add(
        new RelationField({
          name: 'tags',
          collectionId: tagsCollection.id,
          maxSelect: 999,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    if (col.fields.getByName('tags')) {
      col.fields.removeByName('tags')
      app.save(col)
    }
  },
)
