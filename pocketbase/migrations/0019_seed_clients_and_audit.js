migrate(
  (app) => {
    const clientsCol = app.findCollectionByNameOrId('clients')

    try {
      app.findFirstRecordByData('clients', 'cnpj_cpf', '12.345.678/0001-90')
    } catch (_) {
      const client = new Record(clientsCol)
      client.set('name', 'Construtora Alpha S.A')
      client.set('email', 'carlos@alpha.com')
      client.set('phone', '(11) 98765-4321')
      client.set('cnpj_cpf', '12.345.678/0001-90')
      client.set('address', 'Av. Paulista, 1000, Bela Vista, São Paulo - SP')
      app.save(client)
    }

    const auditCol = app.findCollectionByNameOrId('audit_logs')
    let user = null
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'tozziengenharia@hotmail.com')
    } catch (_) {
      try {
        user = app.findFirstRecordByFilter('_pb_users_auth_', "email != ''")
      } catch (_) {}
    }

    if (user) {
      const log = new Record(auditCol)
      log.set('user_id', user.id)
      log.set('action', 'LOGIN')
      log.set('resource', 'Sistema')
      log.set('details', { ip: '127.0.0.1', browser: 'Chrome' })
      app.save(log)
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM clients WHERE cnpj_cpf = '12.345.678/0001-90'").execute()
      app.db().newQuery("DELETE FROM audit_logs WHERE action = 'LOGIN'").execute()
    } catch (_) {}
  },
)
