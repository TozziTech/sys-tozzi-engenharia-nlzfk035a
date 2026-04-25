migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    if (!col.fields.getByName('module_visibility')) {
      col.fields.add(
        new JSONField({
          name: 'module_visibility',
          required: false,
          maxSize: 2000000,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('company_settings')
    col.fields.removeByName('module_visibility')
    app.save(col)
  },
)
