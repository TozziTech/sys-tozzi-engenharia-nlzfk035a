migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Define role for the default admin user
    try {
      const admin = app.findAuthRecordByEmail('users', 'tozziengenharia@hotmail.com')
      admin.set('role', 'Administrador')
      app.save(admin)
    } catch (_) {
      // Admin doesn't exist yet, safe to skip
    }

    const seedUsers = [
      {
        email: 'mariana@example.com',
        name: 'Mariana',
        role: 'Gerente de Projeto',
        codigo: 'PER-002',
      },
      { email: 'roberto@example.com', name: 'Roberto', role: 'Projetista', codigo: 'PER-003' },
      { email: 'ana@example.com', name: 'Ana', role: 'Estagiário', codigo: 'PER-004' },
      { email: 'carlos@example.com', name: 'Carlos', role: 'Visitante', codigo: 'PER-005' },
    ]

    for (const u of seedUsers) {
      try {
        // Idempotent: skip if user already exists
        app.findAuthRecordByEmail('users', u.email)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(u.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', u.name)
        record.set('role', u.role)
        record.set('codigo', u.codigo)
        record.set('status', 'Ativo')
        app.save(record)
      }
    }
  },
  (app) => {
    const emails = [
      'mariana@example.com',
      'roberto@example.com',
      'ana@example.com',
      'carlos@example.com',
    ]
    for (const email of emails) {
      try {
        const record = app.findAuthRecordByEmail('users', email)
        app.delete(record)
      } catch (_) {}
    }
  },
)
