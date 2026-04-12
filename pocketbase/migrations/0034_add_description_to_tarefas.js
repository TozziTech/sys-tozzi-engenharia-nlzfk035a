migrate(
  (app) => {
    try {
      const thCol = app.findCollectionByNameOrId('tarefas_hierarquicas')
      if (!thCol.fields.getByName('descricao')) {
        thCol.fields.add(new TextField({ name: 'descricao' }))
        app.save(thCol)
      }
    } catch (err) {
      console.error('Failed to update tarefas_hierarquicas', err)
    }

    try {
      const tCol = app.findCollectionByNameOrId('tasks')
      if (!tCol.fields.getByName('description')) {
        tCol.fields.add(new TextField({ name: 'description' }))
        app.save(tCol)
      }
    } catch (err) {
      console.error('Failed to update tasks', err)
    }
  },
  (app) => {
    try {
      const thCol = app.findCollectionByNameOrId('tarefas_hierarquicas')
      thCol.fields.removeByName('descricao')
      app.save(thCol)
    } catch (_) {}

    try {
      const tCol = app.findCollectionByNameOrId('tasks')
      tCol.fields.removeByName('description')
      app.save(tCol)
    } catch (_) {}
  },
)
