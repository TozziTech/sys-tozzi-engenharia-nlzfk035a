migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contacts')

    const oldCat = col.fields.getByName('category')
    if (oldCat) {
      oldCat.name = 'old_category'
    }

    col.fields.add(new TextField({ name: 'category' }))
    col.fields.add(new TextField({ name: 'code' }))
    col.fields.add(new TextField({ name: 'alt_phone' }))
    col.fields.add(new TextField({ name: 'address' }))
    col.fields.add(new TextField({ name: 'notes' }))

    app.save(col)

    // Migrate data
    app.db().newQuery(`UPDATE contacts SET category = old_category`).execute()

    // Ensure every row has a unique code before enforcing required & unique constraints
    app
      .db()
      .newQuery(
        `UPDATE contacts SET code = 'CTT-' || hex(randomblob(4)) WHERE code IS NULL OR code = ''`,
      )
      .execute()

    col.fields.removeByName('old_category')

    const catField = col.fields.getByName('category')
    catField.required = true

    const codeField = col.fields.getByName('code')
    codeField.required = true

    app.save(col)

    // Add unique index for code
    col.addIndex('idx_contacts_code', true, 'code', '')
    app.save(col)

    // Seed example
    try {
      app.findFirstRecordByData('contacts', 'code', 'CTT-001')
    } catch (_) {
      const record = new Record(col)
      record.set('code', 'CTT-001')
      record.set('name', 'João Silva')
      record.set('category', 'Fornecedor')
      record.set('address', 'Rua Exemplo, 123, São Paulo - SP')
      record.set('phone', '(11) 99999-9999')
      record.set('notes', 'Contato principal para fornecimento de materiais.')
      app.save(record)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contacts')

    col.fields.removeByName('code')
    col.fields.removeByName('alt_phone')
    col.fields.removeByName('address')
    col.fields.removeByName('notes')

    const oldCat = col.fields.getByName('category')
    if (oldCat) {
      oldCat.name = 'new_category'
    }
    col.fields.add(
      new SelectField({
        name: 'category',
        required: true,
        values: ['Cliente', 'Fornecedor', 'Parceiro'],
      }),
    )
    app.save(col)

    app.db().newQuery(`UPDATE contacts SET category = new_category`).execute()

    col.fields.removeByName('new_category')
    col.removeIndex('idx_contacts_code')
    app.save(col)
  },
)
