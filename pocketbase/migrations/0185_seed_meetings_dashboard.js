migrate(
  (app) => {
    // 1. Add 'task' relation to meeting_actions if not exists
    const meetingActions = app.findCollectionByNameOrId('meeting_actions')
    if (!meetingActions.fields.getByName('task')) {
      meetingActions.fields.add(
        new RelationField({
          name: 'task',
          collectionId: app.findCollectionByNameOrId('tasks').id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      app.save(meetingActions)
    }

    // 2. Seed meetings and actions
    const projects = app.findCollectionByNameOrId('projects')
    const meetings = app.findCollectionByNameOrId('meetings')
    const users = app.findCollectionByNameOrId('users')

    let projId = null
    try {
      const p = app.findFirstRecordByData('projects', 'name', 'Projeto Piloto Alpha')
      projId = p.id
    } catch (_) {
      try {
        const p = new Record(projects)
        p.set('name', 'Projeto Piloto Alpha')
        p.set('status', 'Em Execução')
        p.set('progress', 45)
        app.save(p)
        projId = p.id
      } catch (_) {
        // Fallback
      }
    }

    if (!projId) return

    let adminId = null
    try {
      const admin = app.findFirstRecordByData('users', 'role', 'Administrador')
      adminId = admin.id
    } catch (_) {
      try {
        const anyUser = app.findFirstRecordByData('users', 'codigo', 'ADM01')
        adminId = anyUser.id
      } catch (_) {}
    }

    if (!adminId) return

    const seedMeetings = [
      { title: 'Alinhamento Semanal (Seed)', status: 'Realizada', daysOffset: -5, duration: 60 },
      { title: 'Revisão de Design (Seed)', status: 'Realizada', daysOffset: -2, duration: 45 },
      { title: 'Kickoff Módulo B (Seed)', status: 'Pendente', daysOffset: 1, duration: 90 },
      {
        title: 'Apresentação de Progresso (Seed)',
        status: 'Pendente',
        daysOffset: 3,
        duration: 60,
      },
      { title: 'Reunião Cliente (Seed)', status: 'Em Andamento', daysOffset: 0, duration: 120 },
    ]

    const now = new Date()
    const createdMeetings = []

    for (const sm of seedMeetings) {
      try {
        app.findFirstRecordByData('meetings', 'title', sm.title)
      } catch (_) {
        const m = new Record(meetings)
        m.set('title', sm.title)
        m.set('project', projId)
        m.set(
          'date_time',
          new Date(now.getTime() + sm.daysOffset * 24 * 60 * 60 * 1000).toISOString(),
        )
        m.set('duration', sm.duration)
        m.set('status', sm.status)
        m.set('participants', [adminId])
        app.save(m)
        createdMeetings.push(m.id)
      }
    }

    if (createdMeetings.length > 0) {
      const statuses = ['Pendente', 'Em Progresso', 'Concluído']
      for (let i = 0; i < 10; i++) {
        const mId = createdMeetings[i % createdMeetings.length]
        const title = 'Ação resultante ' + (i + 1)
        try {
          app.findFirstRecordByData('meeting_actions', 'description', title)
        } catch (_) {
          const a = new Record(meetingActions)
          a.set('meeting', mId)
          a.set('description', title)
          a.set('responsible', adminId)
          a.set(
            'due_date',
            new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] +
              ' 12:00:00.000Z',
          )
          a.set('status', statuses[i % 3])
          app.save(a)
        }
      }
    }
  },
  (app) => {
    // Down
  },
)
