migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('code')) {
      col.fields.add(new TextField({ name: 'code', required: true }))
    }
    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({ name: 'status', values: ['Ativo', 'Inativo'], maxSelect: 1 }),
      )
    }
    if (!col.fields.getByName('notes')) {
      col.fields.add(new TextField({ name: 'notes' }))
    }
    if (!col.fields.getByName('documents')) {
      col.fields.add(new FileField({ name: 'documents', maxSelect: 99, maxSize: 52428800 })) // 50MB max
    }

    app.save(col)

    // Backfill existing records with code and status
    const records = app.findRecordsByFilter('clients', "code = ''", 'created', 10000, 0)
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      record.set('code', 'CLI-' + String(i + 1).padStart(3, '0'))
      record.set('status', 'Ativo')
      app.saveNoValidate(record)
    }

    // Add unique index for the code
    col.addIndex('idx_clients_code', true, 'code', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.removeField('code')
    col.removeField('status')
    col.removeField('notes')
    col.removeField('documents')
    col.removeIndex('idx_clients_code')
    app.save(col)
  },
)
