migrate(
  (app) => {
    const projects = app.findRecordsByFilter('projects', '1=1', '-created', 3, 0)

    projects.forEach((p) => {
      p.set('is_priority', true)
      app.save(p)
    })

    if (projects.length > 0) {
      try {
        const docsCol = app.findCollectionByNameOrId('project_documents')
        const doc = new Record(docsCol)
        doc.set('project', projects[0].id)
        doc.set('name', 'Contrato Inicial.pdf')
        doc.set('type', 'Contract')
        app.save(doc)
      } catch (_) {}
    }
  },
  (app) => {
    const projects = app.findRecordsByFilter('projects', 'is_priority = true', '', 100, 0)
    projects.forEach((p) => {
      p.set('is_priority', false)
      app.save(p)
    })

    const docs = app.findRecordsByFilter('project_documents', '1=1', '', 100, 0)
    docs.forEach((d) => {
      app.delete(d)
    })
  },
)
