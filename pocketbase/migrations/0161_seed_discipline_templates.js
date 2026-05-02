migrate(
  (app) => {
    const dtCol = app.findCollectionByNameOrId('discipline_templates')
    const ttCol = app.findCollectionByNameOrId('task_templates')

    const templates = [
      {
        name: 'Projeto Estrutural',
        description: 'Template para projetos estruturais padrão',
        tasks: [
          { title: 'Lançamento', priority: 'Média', ordem: 1 },
          { title: 'Pré-dimensionamento', priority: 'Média', ordem: 2 },
          { title: 'Detalhamento', priority: 'Média', ordem: 3 },
          { title: 'Emissão de Pranchas', priority: 'Alta', ordem: 4 },
        ],
      },
      {
        name: 'Projeto Elétrico',
        description: 'Template para projetos elétricos padrão',
        tasks: [
          { title: 'Cálculo de Carga', priority: 'Média', ordem: 1 },
          { title: 'Quadro de Cargas', priority: 'Média', ordem: 2 },
          { title: 'Diagramas Unifilares', priority: 'Alta', ordem: 3 },
        ],
      },
      {
        name: 'Projeto Hidrossanitário',
        description: 'Template para projetos hidrossanitários padrão',
        tasks: [
          { title: 'Traçado de Tubulações', priority: 'Média', ordem: 1 },
          { title: 'Dimensionamento de Reservatórios', priority: 'Alta', ordem: 2 },
          { title: 'Detalhamento Isométrico', priority: 'Média', ordem: 3 },
        ],
      },
    ]

    for (const tpl of templates) {
      try {
        app.findFirstRecordByData('discipline_templates', 'name', tpl.name)
      } catch (_) {
        const dtRecord = new Record(dtCol)
        dtRecord.set('name', tpl.name)
        dtRecord.set('description', tpl.description)
        app.save(dtRecord)

        for (const tsk of tpl.tasks) {
          const ttRecord = new Record(ttCol)
          ttRecord.set('discipline_template', dtRecord.id)
          ttRecord.set('title', tsk.title)
          ttRecord.set('priority', tsk.priority)
          ttRecord.set('ordem', tsk.ordem)
          ttRecord.set('is_internal', false)
          app.save(ttRecord)
        }
      }
    }
  },
  (app) => {
    const names = ['Projeto Estrutural', 'Projeto Elétrico', 'Projeto Hidrossanitário']
    for (const name of names) {
      try {
        const record = app.findFirstRecordByData('discipline_templates', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
