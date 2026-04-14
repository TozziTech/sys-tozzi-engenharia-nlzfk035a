migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('document_resources')
    const seeds = [
      {
        title: 'Manual de Engenharia Civil',
        description: 'Referência completa de cálculo estrutural',
        category: 'Biblioteca',
        url: 'https://example.com/manual',
      },
      {
        title: 'POP - Vistoria de Obra',
        description: 'Procedimento padrão para vistoria',
        category: 'POPs',
        url: 'https://example.com/pop-vistoria',
      },
      {
        title: 'Projeto Base - Residência 200m²',
        description: 'Modelo base para casas de alto padrão',
        category: 'Projetos Base',
        url: 'https://example.com/projeto-base',
      },
      {
        title: 'Planilha de Orçamento Padrão',
        description: 'Template em Excel para orçamentos rápidos',
        category: 'Documentos Modelos',
        url: 'https://example.com/planilha',
      },
      {
        title: 'Curso: Revit Avançado',
        description: 'Treinamento interno de modelagem 3D',
        category: 'Cursos',
        url: 'https://example.com/curso-revit',
      },
    ]

    seeds.forEach((seed) => {
      try {
        app.findFirstRecordByData('document_resources', 'title', seed.title)
      } catch (_) {
        const record = new Record(col)
        record.set('title', seed.title)
        record.set('description', seed.description)
        record.set('category', seed.category)
        record.set('url', seed.url)
        app.save(record)
      }
    })
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('document_resources', "title != ''", '', 100, 0)
      records.forEach((r) => app.delete(r))
    } catch (_) {}
  },
)
