migrate(
  (app) => {
    try {
      const modules = app.findRecordsByFilter('project_modules', '1=1', '-created', 1, 0)
      if (modules.length === 0) return

      const mod = modules[0]

      // Seed 1
      try {
        app.findFirstRecordByData('project_versions', 'version_label', 'R00')
      } catch (_) {
        app
          .db()
          .newQuery(
            'INSERT INTO project_versions (id, module, version_label, description, file, created, updated) VALUES ({:id}, {:module}, {:version_label}, {:description}, {:file}, {:created}, {:updated})',
          )
          .bind({
            id: 'seedversion0001',
            module: mod.id,
            version_label: 'R00',
            description: 'Emissão inicial (mock)',
            file: '',
            created: new Date().toISOString().replace('T', ' ').replace('Z', 'Z'),
            updated: new Date().toISOString().replace('T', ' ').replace('Z', 'Z'),
          })
          .execute()
      }

      // Seed 2
      try {
        app.findFirstRecordByData('project_versions', 'version_label', 'R01')
      } catch (_) {
        app
          .db()
          .newQuery(
            'INSERT INTO project_versions (id, module, version_label, description, file, created, updated) VALUES ({:id}, {:module}, {:version_label}, {:description}, {:file}, {:created}, {:updated})',
          )
          .bind({
            id: 'seedversion0002',
            module: mod.id,
            version_label: 'R01',
            description: 'Revisão 01 - Ajustes (mock)',
            file: '',
            created: new Date().toISOString().replace('T', ' ').replace('Z', 'Z'),
            updated: new Date().toISOString().replace('T', ' ').replace('Z', 'Z'),
          })
          .execute()
      }
    } catch (err) {
      console.log('Error seeding project_versions:', err)
    }
  },
  (app) => {
    app
      .db()
      .newQuery("DELETE FROM project_versions WHERE id IN ('seedversion0001', 'seedversion0002')")
      .execute()
  },
)
