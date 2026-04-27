migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('project_modules')
    const statusField = collection.fields.getByName('status')
    statusField.values = [
      'Pendente',
      'Em Andamento',
      'Concluído',
      'Pausado',
      'Em Análise',
      'Em Revisão',
    ]
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('project_modules')
    const statusField = collection.fields.getByName('status')
    statusField.values = ['Pendente', 'Em Andamento', 'Concluído', 'Pausado']
    app.save(collection)
  },
)
