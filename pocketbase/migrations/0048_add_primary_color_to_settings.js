migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('primary_color')) {
      col.fields.add(new TextField({ name: 'primary_color' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (col.fields.getByName('primary_color')) {
      col.fields.removeByName('primary_color')
    }
    app.save(col)
  },
)
