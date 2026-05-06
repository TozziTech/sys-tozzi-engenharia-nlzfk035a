migrate(
  (app) => {
    const tCol = app.findCollectionByNameOrId('meeting_templates')
    const aCol = app.findCollectionByNameOrId('meeting_template_agenda_items')

    try {
      app.findFirstRecordByData('meeting_templates', 'name', 'Reunião de Alinhamento')
    } catch (_) {
      const t1 = new Record(tCol)
      t1.set('name', 'Reunião de Alinhamento')
      t1.set('description', 'Reunião padrão para alinhamento de status e próximos passos.')
      t1.set(
        'default_minutes',
        '<p><strong>Tópicos discutidos:</strong></p><br><p><strong>Decisões tomadas:</strong></p>',
      )
      app.save(t1)

      const i1_1 = new Record(aCol)
      i1_1.set('template', t1.id)
      i1_1.set('topic', 'Status Report')
      i1_1.set('estimated_time', 15)
      i1_1.set('order', 1)
      app.save(i1_1)
      const i1_2 = new Record(aCol)
      i1_2.set('template', t1.id)
      i1_2.set('topic', 'Roadblocks')
      i1_2.set('estimated_time', 15)
      i1_2.set('order', 2)
      app.save(i1_2)
      const i1_3 = new Record(aCol)
      i1_3.set('template', t1.id)
      i1_3.set('topic', 'Next Steps')
      i1_3.set('estimated_time', 10)
      i1_3.set('order', 3)
      app.save(i1_3)
    }

    try {
      app.findFirstRecordByData('meeting_templates', 'name', 'Sprint Planning')
    } catch (_) {
      const t2 = new Record(tCol)
      t2.set('name', 'Sprint Planning')
      t2.set('description', 'Planejamento da próxima sprint.')
      t2.set(
        'default_minutes',
        '<p><strong>Objetivo da Sprint:</strong></p><br><p><strong>Capacidade da Equipe:</strong></p>',
      )
      app.save(t2)

      const i2_1 = new Record(aCol)
      i2_1.set('template', t2.id)
      i2_1.set('topic', 'Goal Definition')
      i2_1.set('estimated_time', 10)
      i2_1.set('order', 1)
      app.save(i2_1)
      const i2_2 = new Record(aCol)
      i2_2.set('template', t2.id)
      i2_2.set('topic', 'Backlog Review')
      i2_2.set('estimated_time', 30)
      i2_2.set('order', 2)
      app.save(i2_2)
      const i2_3 = new Record(aCol)
      i2_3.set('template', t2.id)
      i2_3.set('topic', 'Task Estimation')
      i2_3.set('estimated_time', 20)
      i2_3.set('order', 3)
      app.save(i2_3)
    }
  },
  (app) => {
    // Pass
  },
)
