migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!col.fields.getByName('email_notifications_enabled')) {
      col.fields.add(new BoolField({ name: 'email_notifications_enabled', presentable: false }))
    }

    if (!col.fields.getByName('deadline_lead_days')) {
      col.fields.add(new NumberField({ name: 'deadline_lead_days', min: 1, presentable: false }))
    }

    app.save(col)

    app
      .db()
      .newQuery(
        `UPDATE users SET email_notifications_enabled = 1, deadline_lead_days = 3 WHERE deadline_lead_days IS NULL OR deadline_lead_days = ''`,
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    col.fields.removeByName('email_notifications_enabled')
    col.fields.removeByName('deadline_lead_days')
    app.save(col)
  },
)
