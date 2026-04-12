migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('project_versions')

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Em Revisão', 'Aprovado'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('is_critical')) {
      col.fields.add(new BoolField({ name: 'is_critical' }))
    }

    if (!col.fields.getByName('approved_by')) {
      col.fields.add(
        new RelationField({
          name: 'approved_by',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('approval_date')) {
      col.fields.add(new DateField({ name: 'approval_date' }))
    }

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE project_versions SET status = 'Pendente' WHERE status = '' OR status IS NULL",
      )
      .execute()
    app
      .db()
      .newQuery('UPDATE project_versions SET is_critical = 0 WHERE is_critical IS NULL')
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('project_versions')
    col.fields.removeByName('status')
    col.fields.removeByName('is_critical')
    col.fields.removeByName('approved_by')
    col.fields.removeByName('approval_date')
    app.save(col)
  },
)
