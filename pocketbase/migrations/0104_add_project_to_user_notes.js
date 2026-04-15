migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')
    if (!col.fields.getByName('project')) {
      col.fields.add(
        new RelationField({
          name: 'project',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('projects').id,
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('user_notes')
    if (col.fields.getByName('project')) {
      col.fields.removeByName('project')
    }
    app.save(col)
  },
)
