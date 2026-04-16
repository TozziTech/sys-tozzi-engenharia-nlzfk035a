migrate(
  (app) => {
    // 1. Update the contact record for "Lucas Tozzi" to code "CTT-001"
    try {
      const lucas = app.findFirstRecordByData('contacts', 'name', 'Lucas Tozzi')
      lucas.set('code', 'CTT-001')
      app.save(lucas)
    } catch (_) {
      // If not found, skip - we only update if it exists per acceptance criteria
    }

    // 2. Remove all existing mock/placeholder data from the contacts list
    app
      .db()
      .newQuery(`
    DELETE FROM contacts
    WHERE name != 'Lucas Tozzi'
      AND (
        email LIKE '%example.com%'
        OR email LIKE '%exemplo.com%'
        OR name IN ('João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Pedro Almeida', 'Empresa Exemplo', 'Fornecedor A', 'Cliente B')
        OR name LIKE 'Mock %'
        OR name LIKE 'Contato %'
      )
  `)
      .execute()
  },
  (app) => {
    // Try to revert Lucas Tozzi to a fallback code if needed, but not strictly required
    try {
      const lucas = app.findFirstRecordByData('contacts', 'name', 'Lucas Tozzi')
      if (lucas.getString('code') === 'CTT-001') {
        lucas.set('code', 'CT-' + Math.floor(Math.random() * 1000))
        app.save(lucas)
      }
    } catch (_) {}
  },
)
