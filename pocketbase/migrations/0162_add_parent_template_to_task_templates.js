migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('task_templates')
    col.fields.add(
      new RelationField({
        name: 'parent_template',
        type: 'relation',
        collectionId: col.id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('task_templates')
    col.fields.removeByName('parent_template')
    app.save(col)
  },
)
