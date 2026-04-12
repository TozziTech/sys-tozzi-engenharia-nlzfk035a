migrate(
  (app) => {
    const tasksCol = app.findCollectionByNameOrId('tasks')
    const tagsCol = app.findCollectionByNameOrId('tags')

    if (!tasksCol.fields.getByName('tags')) {
      tasksCol.fields.add(
        new RelationField({
          name: 'tags',
          collectionId: tagsCol.id,
          cascadeDelete: false,
          maxSelect: 999,
        }),
      )
      app.save(tasksCol)
    }
  },
  (app) => {
    const tasksCol = app.findCollectionByNameOrId('tasks')
    const field = tasksCol.fields.getByName('tags')
    if (field) {
      tasksCol.fields.removeByName('tags')
      app.save(tasksCol)
    }
  },
)
