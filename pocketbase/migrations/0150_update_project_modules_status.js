migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    const statusField = col.fields.getByName('status')
    if (statusField && !statusField.selectValues.includes('Em Aprovação')) {
      statusField.selectValues.push('Em Aprovação')
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_modules')
    const statusField = col.fields.getByName('status')
    if (statusField && statusField.selectValues.includes('Em Aprovação')) {
      statusField.selectValues = statusField.selectValues.filter((v) => v !== 'Em Aprovação')
      app.save(col)
    }
  },
)
