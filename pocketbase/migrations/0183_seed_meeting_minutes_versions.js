migrate(
  (app) => {
    let meetings
    try {
      meetings = app.findRecordsByFilter('meetings', "id != ''", '-created', 1)
    } catch (e) {
      return
    }
    if (meetings.length === 0) return

    const meeting = meetings[0]
    meeting.set('status', 'Realizada')
    meeting.set(
      'minutes',
      'Ata revisada. Adicionamos a decisão final sobre o escopo do projeto e os responsáveis por cada tarefa.',
    )
    app.save(meeting)

    let users
    try {
      users = app.findRecordsByFilter('_pb_users_auth_', "role = 'Administrador'", '', 1)
    } catch (e) {
      try {
        users = app.findRecordsByFilter('_pb_users_auth_', "id != ''", '', 1)
      } catch (err) {
        return
      }
    }
    if (users.length === 0) return
    const user = users[0]

    const col = app.findCollectionByNameOrId('meeting_minutes_versions')

    try {
      app.findFirstRecordByData('meeting_minutes_versions', 'meeting', meeting.id)
      return // already seeded
    } catch (_) {}

    const v1 = new Record(col)
    v1.set('meeting', meeting.id)
    v1.set('content', 'Rascunho inicial da ata da reunião. Discutimos os tópicos principais.')
    v1.set('version_label', 'v1')
    v1.set('author', user.id)
    app.save(v1)

    const v2 = new Record(col)
    v2.set('meeting', meeting.id)
    v2.set(
      'content',
      'Ata revisada. Adicionamos a decisão final sobre o escopo do projeto e os responsáveis por cada tarefa.',
    )
    v2.set('version_label', 'v2')
    v2.set('author', user.id)
    app.save(v2)
  },
  (app) => {
    app.db().newQuery('DELETE FROM meeting_minutes_versions').execute()
  },
)
