migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUsers = [
      {
        email: 'mariana@tozzi.com.br',
        name: 'Mariana',
        role: 'Gerente de Projeto',
        status: 'Ativo',
        codigo: 'MAT-002',
      },
      {
        email: 'roberto@tozzi.com.br',
        name: 'Roberto',
        role: 'Projetista',
        status: 'Ativo',
        codigo: 'MAT-003',
      },
      {
        email: 'ana@tozzi.com.br',
        name: 'Ana',
        role: 'Estagiário',
        status: 'Ativo',
        codigo: 'MAT-004',
      },
      {
        email: 'carlos@tozzi.com.br',
        name: 'Carlos',
        role: 'Visitante',
        status: 'Ativo',
        codigo: 'MAT-005',
      },
    ]

    for (const u of seedUsers) {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', u.email)
        // skip if exists
      } catch (_) {
        const record = new Record(users)
        record.setEmail(u.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', u.name)
        record.set('role', u.role)
        record.set('status', u.status)
        record.set('codigo', u.codigo)
        app.save(record)
      }
    }
  },
  (app) => {
    const emails = [
      'mariana@tozzi.com.br',
      'roberto@tozzi.com.br',
      'ana@tozzi.com.br',
      'carlos@tozzi.com.br',
    ]
    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(record)
      } catch (_) {}
    }
  },
)
