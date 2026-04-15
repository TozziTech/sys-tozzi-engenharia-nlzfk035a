migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('chart_colors')) {
      col.fields.add(new JSONField({ name: 'chart_colors' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (col.fields.getByName('chart_colors')) {
      col.fields.removeByName('chart_colors')
    }
    app.save(col)
  },
)
