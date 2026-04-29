migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('report_schedules')

    col.fields.add(
      new RelationField({
        name: 'project',
        collectionId: app.findCollectionByNameOrId('projects').id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('report_schedules')
    col.fields.removeByName('project')
    app.save(col)
  },
)
