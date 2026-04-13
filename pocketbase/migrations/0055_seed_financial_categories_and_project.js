migrate(
  (app) => {
    try {
      app.findFirstRecordByData('projects', 'name', 'TOZZI')
    } catch (_) {
      const projectsCol = app.findCollectionByNameOrId('projects')
      const project = new Record(projectsCol)
      project.set('name', 'TOZZI')
      project.set('status', 'Em Andamento')
      app.save(project)
    }

    const categories = [
      { name: 'Projetista Associado', color: '#3b82f6' },
      { name: 'Administrativa', color: '#10b981' },
      { name: 'Cursos', color: '#f59e0b' },
      { name: 'Equipamentos', color: '#ef4444' },
    ]

    const catCol = app.findCollectionByNameOrId('financial_categories')

    for (const cat of categories) {
      try {
        app.findFirstRecordByData('financial_categories', 'name', cat.name)
      } catch (_) {
        const record = new Record(catCol)
        record.set('name', cat.name)
        record.set('color', cat.color)
        app.save(record)
      }
    }
  },
  (app) => {},
)
