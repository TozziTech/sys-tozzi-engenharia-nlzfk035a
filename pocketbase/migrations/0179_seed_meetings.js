migrate(
  (app) => {
    const users = app.findRecordsByFilter('_pb_users_auth_', "role != 'Cliente'", '', 5, 0)
    if (users.length === 0) return

    let projects = []
    try {
      projects = app.findRecordsByFilter('projects', "status != 'Concluído'", '', 2, 0)
    } catch (_) {}

    const meetingsCol = app.findCollectionByNameOrId('meetings')
    const agendaCol = app.findCollectionByNameOrId('meeting_agenda_items')
    const docsCol = app.findCollectionByNameOrId('meeting_documents')

    const m1 = new Record(meetingsCol)
    m1.set('title', 'Alinhamento de Projeto Alpha')
    if (projects.length > 0) m1.set('project', projects[0].id)
    m1.set(
      'date_time',
      new Date(Date.now() + 86400000).toISOString().replace('T', ' ').substring(0, 19) + 'Z',
    )
    m1.set('duration', 60)
    m1.set('participants', [
      { user_id: users[0].id, is_mandatory: true },
      { user_id: users[1]?.id || users[0].id, is_mandatory: false },
    ])
    m1.set('status', 'Pendente')
    app.save(m1)

    const m2 = new Record(meetingsCol)
    m2.set('title', 'Revisão Executiva Mensal')
    m2.set(
      'date_time',
      new Date(Date.now() + 86400000 * 2).toISOString().replace('T', ' ').substring(0, 19) + 'Z',
    )
    m2.set('duration', 120)
    m2.set('participants', [{ user_id: users[0].id, is_mandatory: true }])
    m2.set('status', 'Pendente')
    app.save(m2)

    const m3 = new Record(meetingsCol)
    m3.set('title', 'Kickoff de Novo Cliente')
    if (projects.length > 1) m3.set('project', projects[1].id)
    m3.set(
      'date_time',
      new Date(Date.now() - 86400000).toISOString().replace('T', ' ').substring(0, 19) + 'Z',
    )
    m3.set('duration', 45)
    m3.set('participants', [{ user_id: users[0].id, is_mandatory: true }])
    m3.set('status', 'Realizada')
    app.save(m3)

    const a1 = new Record(agendaCol)
    a1.set('meeting', m1.id)
    a1.set('topic', 'Definição de cronograma')
    a1.set('estimated_time', 20)
    a1.set('responsible', users[0].id)
    a1.set('order', 1)
    app.save(a1)

    const a2 = new Record(agendaCol)
    a2.set('meeting', m1.id)
    a2.set('topic', 'Alocação de recursos')
    a2.set('estimated_time', 30)
    a2.set('responsible', users[0].id)
    a2.set('order', 2)
    app.save(a2)

    const a3 = new Record(agendaCol)
    a3.set('meeting', m1.id)
    a3.set('topic', 'Dúvidas gerais')
    a3.set('estimated_time', 10)
    a3.set('responsible', users[0].id)
    a3.set('order', 3)
    app.save(a3)

    const d1 = new Record(docsCol)
    d1.set('meeting', m1.id)
    d1.set('name', 'Apresentacao_Inicial.pdf')
    app.save(d1)

    const d2 = new Record(docsCol)
    d2.set('meeting', m1.id)
    d2.set('name', 'Escopo_Revisado.docx')
    app.save(d2)
  },
  (app) => {
    try {
      app.db().newQuery('DELETE FROM meeting_documents').execute()
    } catch (_) {}
    try {
      app.db().newQuery('DELETE FROM meeting_agenda_items').execute()
    } catch (_) {}
    try {
      app.db().newQuery('DELETE FROM meetings').execute()
    } catch (_) {}
  },
)
