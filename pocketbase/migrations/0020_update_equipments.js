migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('equipments')

    if (!col.fields.getByName('last_maintenance')) {
      col.fields.add(new DateField({ name: 'last_maintenance' }))
    }
    if (!col.fields.getByName('next_maintenance')) {
      col.fields.add(new DateField({ name: 'next_maintenance' }))
    }
    if (!col.fields.getByName('condition')) {
      col.fields.add(
        new SelectField({
          name: 'condition',
          values: ['Novo', 'Bom', 'Necessita Reparo', 'Em Manutenção'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('usage_notes')) {
      col.fields.add(new TextField({ name: 'usage_notes' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('equipments')
    col.fields.removeByName('last_maintenance')
    col.fields.removeByName('next_maintenance')
    col.fields.removeByName('condition')
    col.fields.removeByName('usage_notes')
    app.save(col)
  },
)
