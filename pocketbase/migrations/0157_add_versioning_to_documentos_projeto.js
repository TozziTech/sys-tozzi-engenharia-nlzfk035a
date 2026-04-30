migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_projeto')

    col.fields.add(
      new RelationField({
        name: 'parent_id',
        collectionId: col.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
    )

    col.fields.add(
      new TextField({
        name: 'version_label',
      }),
    )

    col.fields.add(
      new TextField({
        name: 'version_notes',
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos_projeto')
    col.fields.removeByName('parent_id')
    col.fields.removeByName('version_label')
    col.fields.removeByName('version_notes')
    app.save(col)
  },
)
