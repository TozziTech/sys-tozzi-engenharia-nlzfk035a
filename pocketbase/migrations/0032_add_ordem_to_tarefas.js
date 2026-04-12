migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tarefas_hierarquicas')
    col.fields.add(new NumberField({ name: 'ordem' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tarefas_hierarquicas')
    col.fields.removeByName('ordem')
    app.save(col)
  },
)
