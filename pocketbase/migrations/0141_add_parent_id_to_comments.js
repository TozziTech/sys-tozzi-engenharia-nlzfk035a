migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('comentarios_projeto')
    col.fields.add(
      new RelationField({
        name: 'parent_id',
        collectionId: col.id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('comentarios_projeto')
    col.fields.removeByName('parent_id')
    app.save(col)
  },
)
