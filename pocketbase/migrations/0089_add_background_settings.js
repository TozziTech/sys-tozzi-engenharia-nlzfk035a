migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('background_color')) {
      col.fields.add(new TextField({ name: 'background_color' }))
    }
    if (!col.fields.getByName('background_preset')) {
      col.fields.add(new TextField({ name: 'background_preset' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    col.fields.removeByName('background_color')
    col.fields.removeByName('background_preset')
    app.save(col)
  },
)
