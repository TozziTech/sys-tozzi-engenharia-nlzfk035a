migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'tozziengenharia@hotmail.com')
    } catch (e) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      user = new Record(users)
      user.setEmail('tozziengenharia@hotmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Admin')
      user.set('role', 'Projetista')
      user.set('codigo', 'ADM001')
      app.save(user)
    }

    let project
    try {
      project = app.findFirstRecordByData('projects', 'name', 'Projeto Alpha')
    } catch (e) {
      const projects = app.findCollectionByNameOrId('projects')
      project = new Record(projects)
      project.set('name', 'Projeto Alpha')
      project.set('status', 'Em Andamento')
      project.set('engineer', user.get('name'))
      app.save(project)
    }

    let eq
    try {
      eq = app.findFirstRecordByData('equipments', 'name', 'Estação Total Leica')
    } catch (e) {
      const eqs = app.findCollectionByNameOrId('equipments')
      eq = new Record(eqs)
      eq.set('name', 'Estação Total Leica')
      eq.set('status', 'Disponível')
      app.save(eq)
    }

    try {
      app.findFirstRecordByData('time_logs', 'hours', 5)
    } catch (e) {
      const logs = app.findCollectionByNameOrId('time_logs')
      const l1 = new Record(logs)
      l1.set('user_id', user.id)
      l1.set('project_id', project.id)
      l1.set('hours', 5)
      l1.set('date', new Date().toISOString())
      app.save(l1)

      const l2 = new Record(logs)
      l2.set('user_id', user.id)
      l2.set('project_id', project.id)
      l2.set('hours', 3)
      l2.set('date', new Date().toISOString())
      app.save(l2)

      const l3 = new Record(logs)
      l3.set('user_id', user.id)
      l3.set('project_id', project.id)
      l3.set('hours', 4)
      l3.set('date', new Date().toISOString())
      app.save(l3)
    }

    try {
      app.findFirstRecordByData('equipment_loans', 'status', 'Ativo')
    } catch (e) {
      const loans = app.findCollectionByNameOrId('equipment_loans')
      const l1 = new Record(loans)
      l1.set('equipment_id', eq.id)
      l1.set('user_id', user.id)
      l1.set('loan_date', new Date().toISOString())
      l1.set('status', 'Ativo')
      app.save(l1)

      eq.set('status', 'Emprestado')
      eq.set('responsible', user.get('name') || user.get('email'))
      app.save(eq)
    }
  },
  (app) => {
    // Safe to omit seed rollback as per guidelines.
  },
)
