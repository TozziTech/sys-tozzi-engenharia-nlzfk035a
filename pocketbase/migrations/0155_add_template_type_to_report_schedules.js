migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('report_schedules')
    col.fields.add(
      new SelectField({
        name: 'template_type',
        values: ['Executivo', 'Técnico', 'Focado em Gráficos'],
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('report_schedules')
    col.fields.removeByName('template_type')
    app.save(col)
  },
)
