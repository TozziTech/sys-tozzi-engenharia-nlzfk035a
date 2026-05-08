migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('checklist_executions')

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({ name: 'status', values: ['em_andamento', 'concluído'], maxSelect: 1 }),
      )
    }
    if (!col.fields.getByName('responsible')) {
      col.fields.add(
        new RelationField({ name: 'responsible', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }
    if (!col.fields.getByName('report_file')) {
      col.fields.add(
        new FileField({
          name: 'report_file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('checklist_executions')
    col.fields.removeByName('status')
    col.fields.removeByName('responsible')
    col.fields.removeByName('report_file')
    app.save(col)
  },
)
