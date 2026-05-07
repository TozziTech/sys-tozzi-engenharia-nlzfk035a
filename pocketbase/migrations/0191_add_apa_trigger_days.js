migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('apa_trigger_days')) {
      col.fields.add(new NumberField({ name: 'apa_trigger_days' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (col.fields.getByName('apa_trigger_days')) {
      col.fields.removeByName('apa_trigger_days')
    }
    app.save(col)
  },
)
