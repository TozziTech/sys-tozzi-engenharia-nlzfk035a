migrate(
  (app) => {
    const tasksCol = app.findCollectionByNameOrId('tasks')

    let moduleId = null
    let userId = null

    try {
      const mod = app.findFirstRecordByFilter('project_modules', '1=1')
      moduleId = mod.id
    } catch (_) {}

    try {
      const user = app.findFirstRecordByFilter('users', '1=1')
      userId = user.id
    } catch (_) {}

    if (moduleId) {
      const parent = new Record(tasksCol)
      parent.set('title', '1. Fase Estrutural (Seed)')
      parent.set('status', 'Em Andamento')
      parent.set('module', moduleId)
      if (userId) parent.set('responsible', userId)
      parent.set('due_date', new Date().toISOString())
      app.save(parent)

      const sub = new Record(tasksCol)
      sub.set('title', '1.1. Fundação e Sapatas (Seed)')
      sub.set('status', 'Pendente')
      sub.set('module', moduleId)
      sub.set('parent_task', parent.id)
      if (userId) sub.set('responsible', userId)
      app.save(sub)

      const subsub = new Record(tasksCol)
      subsub.set('title', '1.1.1. Escavação Técnica (Seed)')
      subsub.set('status', 'Pendente')
      subsub.set('module', moduleId)
      subsub.set('parent_task', sub.id)
      app.save(subsub)
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM tasks WHERE title LIKE '%(Seed)%'").execute()
    } catch (_) {}
  },
)
