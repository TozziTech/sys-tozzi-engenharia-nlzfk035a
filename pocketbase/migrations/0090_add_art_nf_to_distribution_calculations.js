migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('distribution_calculations')
    col.fields.add(new NumberField({ name: 'art_amount' }))
    col.fields.add(new NumberField({ name: 'nf_pct', max: 100 }))
    col.fields.add(new NumberField({ name: 'nf_amount' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('distribution_calculations')
    col.fields.removeByName('art_amount')
    col.fields.removeByName('nf_pct')
    col.fields.removeByName('nf_amount')
    app.save(col)
  },
)
