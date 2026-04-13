migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    const usersCol = app.findCollectionByNameOrId('users')
    col.fields.add(
      new RelationField({
        name: 'responsible',
        type: 'relation',
        collectionId: usersCol.id,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    col.fields.removeByName('responsible')
    app.save(col)
  },
)
