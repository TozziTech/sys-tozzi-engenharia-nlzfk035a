migrate(
  (app) => {
    try {
      const modulesCol = app.findCollectionByNameOrId('project_modules')
      let project
      try {
        project = app.findFirstRecordByFilter('projects', '1=1')
      } catch (_) {
        return // No projects exist
      }

      const modules = [
        {
          name: 'Projeto Estrutural',
          status: 'Em Andamento',
          progress: 45,
          deadline: '2026-12-31 12:00:00.000Z',
          notes: 'Fase de cálculos',
        },
        {
          name: 'Projeto Elétrico',
          status: 'Pendente',
          progress: 0,
          deadline: '2027-01-15 12:00:00.000Z',
          notes: 'Aguardando arquitetura',
        },
        {
          name: 'Projeto Hidrossanitário',
          status: 'Concluído',
          progress: 100,
          deadline: '2026-10-10 12:00:00.000Z',
          notes: 'Entregue e aprovado',
        },
      ]

      for (const m of modules) {
        try {
          app.findFirstRecordByData('project_modules', 'name', m.name)
        } catch (_) {
          const record = new Record(modulesCol)
          record.set('name', m.name)
          record.set('project', project.id)
          record.set('status', m.status)
          record.set('progress', m.progress)
          record.set('deadline', m.deadline)
          record.set('notes', m.notes)
          app.save(record)
        }
      }
    } catch (err) {
      console.log('Could not seed modules:', err)
    }
  },
  (app) => {
    try {
      const modulesCol = app.findCollectionByNameOrId('project_modules')
      app.truncateCollection(modulesCol)
    } catch (_) {}
  },
)
