migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contacts')

    // Remove duplicates to ensure UNIQUE index can be applied
    app
      .db()
      .newQuery(`
    DELETE FROM contacts WHERE id NOT IN (
      SELECT MIN(id) FROM contacts GROUP BY code
    ) AND code IS NOT NULL AND code != ''
  `)
      .execute()

    // Remove any existing index on 'code' to prevent "The index definition already exists" error
    const newIndexes = []
    const existingIndexes = col.indexes || []
    for (let i = 0; i < existingIndexes.length; i++) {
      const idx = existingIndexes[i]
      if (idx.includes('(code)') || idx.includes('(`code`)') || idx.includes('idx_contacts_code')) {
        continue
      }
      newIndexes.push(idx)
    }
    col.indexes = newIndexes

    // Add the unique index
    col.addIndex('idx_contacts_code_unique', true, 'code', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contacts')
    col.removeIndex('idx_contacts_code_unique')
    app.save(col)
  },
)
