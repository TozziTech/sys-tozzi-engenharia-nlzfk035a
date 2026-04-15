migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('fases_projeto')

    if (!col.fields.getByName('feedback_revisao')) {
      col.fields.add(new TextField({ name: 'feedback_revisao' }))
    }

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Pendente',
        'Em Andamento',
        'Aguardando Aprovação',
        'Aprovado',
        'Revisão Solicitada',
        'Concluído',
      ]
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('fases_projeto')

    col.fields.removeByName('feedback_revisao')

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Pendente', 'Em Andamento', 'Concluído']
    }

    app.save(col)
  },
)
