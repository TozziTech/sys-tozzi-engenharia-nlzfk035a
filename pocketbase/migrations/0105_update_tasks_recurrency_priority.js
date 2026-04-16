migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    if (!col.fields.getByName('is_recurring')) {
      col.fields.add(new BoolField({ name: 'is_recurring' }))
    }
    if (!col.fields.getByName('frequency')) {
      col.fields.add(
        new SelectField({
          name: 'frequency',
          values: ['Diário', 'Semanal', 'Mensal', 'Anual'],
          maxSelect: 1,
        }),
      )
    }
    if (!col.fields.getByName('recurrence_group_id')) {
      col.fields.add(new TextField({ name: 'recurrence_group_id' }))
    }
    if (!col.fields.getByName('priority')) {
      col.fields.add(
        new SelectField({
          name: 'priority',
          values: ['Baixa', 'Média', 'Alta', 'Urgente'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tasks')

    col.fields.removeByName('is_recurring')
    col.fields.removeByName('frequency')
    col.fields.removeByName('recurrence_group_id')
    col.fields.removeByName('priority')

    app.save(col)
  },
)
