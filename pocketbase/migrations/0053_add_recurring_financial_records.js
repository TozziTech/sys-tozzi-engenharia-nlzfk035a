migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')

    if (!col.fields.getByName('is_recurring')) {
      col.fields.add(new BoolField({ name: 'is_recurring' }))
    }
    if (!col.fields.getByName('frequency')) {
      col.fields.add(
        new SelectField({
          name: 'frequency',
          values: ['Semanal', 'Mensal', 'Anual'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('end_date')) {
      col.fields.add(new DateField({ name: 'end_date' }))
    }
    if (!col.fields.getByName('recurrence_group_id')) {
      col.fields.add(new TextField({ name: 'recurrence_group_id' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('financial_records')
    col.fields.removeByName('is_recurring')
    col.fields.removeByName('frequency')
    col.fields.removeByName('end_date')
    col.fields.removeByName('recurrence_group_id')
    app.save(col)
  },
)
