migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'tozziengenharia@hotmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('tozziengenharia@hotmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin Tozzi')
      app.save(record)
    }

    const equipments = app.findCollectionByNameOrId('equipments')
    try {
      app.findFirstRecordByData('equipments', 'name', 'Estação Total Leica')
    } catch (_) {
      const e1 = new Record(equipments)
      e1.set('name', 'Estação Total Leica')
      e1.set('category', 'Topografia')
      e1.set('status', 'Em Uso')
      e1.set('responsible', 'Eng. João')
      app.save(e1)
    }

    const projects = app.findCollectionByNameOrId('projects')
    try {
      app.findFirstRecordByData('projects', 'name', 'Edifício Aurora')
    } catch (_) {
      const p1 = new Record(projects)
      p1.set('name', 'Edifício Aurora')
      p1.set('client', 'Construtora Alfa')
      p1.set('status', 'Em Andamento')
      p1.set('progress', 65)
      p1.set('budget', 150000)
      p1.set('spent', 45000)
      app.save(p1)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'tozziengenharia@hotmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
