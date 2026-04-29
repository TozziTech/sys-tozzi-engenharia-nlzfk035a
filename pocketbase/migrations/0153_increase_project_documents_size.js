migrate(
  (app) => {
    const projectDocs = app.findCollectionByNameOrId('project_documents')
    const fileField1 = projectDocs.fields.getByName('file')
    if (fileField1) {
      fileField1.maxSize = 104857600 // 100MB
    }
    app.save(projectDocs)

    const docProjeto = app.findCollectionByNameOrId('documentos_projeto')
    const fileField2 = docProjeto.fields.getByName('arquivo')
    if (fileField2) {
      fileField2.maxSize = 104857600 // 100MB
    }
    app.save(docProjeto)
  },
  (app) => {
    const projectDocs = app.findCollectionByNameOrId('project_documents')
    const fileField1 = projectDocs.fields.getByName('file')
    if (fileField1) {
      fileField1.maxSize = 5242880 // 5MB (default)
    }
    app.save(projectDocs)

    const docProjeto = app.findCollectionByNameOrId('documentos_projeto')
    const fileField2 = docProjeto.fields.getByName('arquivo')
    if (fileField2) {
      fileField2.maxSize = 5242880 // 5MB (default)
    }
    app.save(docProjeto)
  },
)
