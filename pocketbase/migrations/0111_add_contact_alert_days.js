migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('contact_alert_days')) {
      col.fields.add(
        new NumberField({
          name: 'contact_alert_days',
          min: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    col.fields.removeByName('contact_alert_days')
    app.save(col)
  },
)
