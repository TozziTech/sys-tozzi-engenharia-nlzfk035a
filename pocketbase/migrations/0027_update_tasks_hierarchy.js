migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    if (!col.fields.getByName('parent_task')) {
      col.fields.add(
        new RelationField({
          name: 'parent_task',
          collectionId: col.id,
          maxSelect: 1,
          cascadeDelete: true,
        }),
      )
    }

    if (!col.fields.getByName('module')) {
      const modCol = app.findCollectionByNameOrId('project_modules')
      col.fields.add(
        new RelationField({
          name: 'module',
          collectionId: modCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        }),
      )
    }

    if (!col.fields.getByName('responsible')) {
      const usersCol = app.findCollectionByNameOrId('users')
      col.fields.add(
        new RelationField({
          name: 'responsible',
          collectionId: usersCol.id,
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('due_date')) {
      col.fields.add(new DateField({ name: 'due_date' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')
    col.fields.removeByName('parent_task')
    col.fields.removeByName('module')
    col.fields.removeByName('responsible')
    col.fields.removeByName('due_date')
    app.save(col)
  },
)
