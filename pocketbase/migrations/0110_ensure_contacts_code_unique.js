migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contacts')
    // Ensure the index for code uniqueness exists.
    col.addIndex('idx_contacts_code_unique', true, 'code', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contacts')
    col.removeIndex('idx_contacts_code_unique')
    app.save(col)
  },
)
