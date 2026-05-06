migrate(
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')
    const agenda = app.findCollectionByNameOrId('meeting_agenda_items')

    const usersRecords = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 5, 0)
    const userIds = usersRecords.map((u) => u.id)

    if (userIds.length > 0) {
      const meeting = new Record(meetings)
      meeting.set('title', 'Reunião de Acompanhamento Semanal')
      meeting.set('date_time', new Date().toISOString())
      meeting.set('duration', 60)
      meeting.set('status', 'Em Andamento')
      meeting.set('participants', userIds)
      meeting.set('attendance', [])
      meeting.set('minutes', '')
      app.save(meeting)

      const a1 = new Record(agenda)
      a1.set('meeting', meeting.id)
      a1.set('topic', 'Apresentação de Resultados')
      a1.set('estimated_time', 15)
      a1.set('order', 1)
      app.save(a1)

      const a2 = new Record(agenda)
      a2.set('meeting', meeting.id)
      a2.set('topic', 'Discussão de Gargalos')
      a2.set('estimated_time', 30)
      a2.set('order', 2)
      app.save(a2)

      const a3 = new Record(agenda)
      a3.set('meeting', meeting.id)
      a3.set('topic', 'Próximos Passos')
      a3.set('estimated_time', 15)
      a3.set('order', 3)
      app.save(a3)
    }
  },
  (app) => {
    // no-op
  },
)
