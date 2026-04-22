migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    if (!col.fields.getByName('cno')) {
      col.fields.add(new TextField({ name: 'cno' }))
    }
    if (!col.fields.getByName('cnpj_obra')) {
      col.fields.add(new TextField({ name: 'cnpj_obra' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projects')
    col.fields.removeByName('cno')
    col.fields.removeByName('cnpj_obra')
    app.save(col)
  },
)
