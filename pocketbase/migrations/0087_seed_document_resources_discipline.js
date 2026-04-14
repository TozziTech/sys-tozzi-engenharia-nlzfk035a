migrate(
  (app) => {
    const records = app.findRecordsByFilter('document_resources', "discipline = ''", '', 100, 0)
    const disciplines = [
      'Concreto Armado',
      'Metálico',
      'Hidrossanitário',
      'Elétrico',
      'Prevenção de Incêndio',
      'Gases',
      'Constr. Civil',
      'Patologia',
      'Outros',
    ]

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      record.set('discipline', disciplines[i % disciplines.length])
      app.saveNoValidate(record)
    }
  },
  (app) => {
    // No easy revert for seeded field updates without storing previous states
  },
)
