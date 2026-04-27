migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    const statusField = col.fields.getByName('status')
    if (statusField && !statusField.values.includes('Em Aprovação')) {
      statusField.values.push('Em Aprovação')
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    const statusField = col.fields.getByName('status')
    if (statusField && statusField.values.includes('Em Aprovação')) {
      statusField.values = statusField.values.filter((v) => v !== 'Em Aprovação')
      app.save(col)
    }
  },
)
