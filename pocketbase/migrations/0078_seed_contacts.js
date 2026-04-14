migrate(
  (app) => {
    const contacts = [
      {
        name: 'João Silva',
        company: 'Empresa Alpha',
        phone: '11999999999',
        email: 'joao@alpha.com',
        category: 'Cliente',
      },
      {
        name: 'Maria Souza',
        company: 'Fornecedora Beta',
        phone: '11988888888',
        email: 'maria@beta.com',
        category: 'Fornecedor',
      },
      {
        name: 'Carlos Pereira',
        company: 'Parceiros Gama',
        phone: '11977777777',
        email: 'carlos@gama.com',
        category: 'Parceiro',
      },
      {
        name: 'Ana Paula',
        company: 'Indústria Delta',
        phone: '11966666666',
        email: 'ana@delta.com',
        category: 'Cliente',
      },
      {
        name: 'Roberto Alves',
        company: 'Serviços Ômega',
        phone: '11955555555',
        email: 'roberto@omega.com',
        category: 'Fornecedor',
      },
    ]

    try {
      const col = app.findCollectionByNameOrId('contacts')

      for (const c of contacts) {
        try {
          app.findFirstRecordByData('contacts', 'email', c.email)
        } catch (_) {
          const record = new Record(col)
          record.set('name', c.name)
          record.set('company', c.company)
          record.set('phone', c.phone)
          record.set('email', c.email)
          record.set('category', c.category)
          app.save(record)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // Down migration: optionally remove seeded data or leave as is
  },
)
